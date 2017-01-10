'use strict'

var Alexa = require('alexa-sdk');
var moment = require('moment');
var helpers = require('./src/lib/helpers.js');
var todoist = require('./src/lib/todoist.js');
var config = require('dotenv').config();

exports.handler = function (event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.registerHandlers(handlers);
    alexa.execute();
};

function findProject(projects, projectName) {
    for (var project in projects) {
        if (projects[project].name.toLowerCase() == projectName.toLowerCase()) {
            return projects[project].id;
        }
    }

    return null;
}

function findTask(tasks, projectId, taskName) {
    for (var task in tasks) {
        if (tasks[task].content.toLowerCase() == taskName.toLowerCase()) {
            if (projectId) {
                if (tasks[task].project_id == projectId) {
                    return tasks[task].id;
                }
            }
            else {
                return tasks[task].id;
            }
        }
    }
}

var handlers = {
    // Need to handle errors below!!
    'LaunchRequest': function () {
        this.emit(':tell', helpers.LAUNCH_DESCRIPTION);

    },
    'AMAZON.YesIntent': function () {

        // Set attributes so we can persist this across the session
        if (this.attributes["createProject"])
            this.emit('AddProjectIntent');
    },
    'AddProjectIntent': function () {
        var that = this;
        var projectName = ((this.event.request.intent.slots) ? this.event.request.intent.slots.projectName.value : that.attributes['projectName']);
        projectName = projectName.capitalizeFirstLetter();
        //Check if the project exists
        todoist.getResources(this, "project", projectName).then(function (response) {
            var projectId = findProject(response.projects, projectName);
            if (projectId) {
                // Found the project - don't create it
                that.emit(':tell', 'Project ' + projectName + ' already exists in your list of projects, try adding a task to it.');
            }
            else {
                todoist.addProject(this, projectName).then(function (response) {
                    // Check if the sync_status returned ok
                    if (JSON.stringify(response).includes('ok')) {
                        if (that.attributes['createTask'])
                        { that.emit('AddTaskProjectIntent') }
                        else {
                            that.emit(':tell', 'Ok, i\'ve created project ' + projectName + ' in your to doist');
                        }
                    }
                });
            }
        });
    },
    'AddTaskProjectIntent': function () {
        var that = this;
        var projectName = ((this.event.request.intent.slots) ? this.event.request.intent.slots.projectName.value : that.attributes['projectName']);
        var taskName = ((this.event.request.intent.slots) ? this.event.request.intent.slots.taskName.value : that.attributes['taskName']);

        todoist.getResources(this, "project", projectName).then(function (response) {
            var projectId = findProject(response.projects, projectName);
            if (projectId) {

                todoist.getResources(this, "task", taskName).then(function (response) {
                    var taskId = findTask(response.items, projectId, taskName);

                    if (taskId) {
                        that.emit(':tell', 'Task ' + taskName + ' already exists in Project ' + projectName + ', try completing this task or adding a new one.');
                    }

                    else {

                        // Found the project - now create the task
                        todoist.addTaskToProject(this, projectId, taskName).then(function (response) {
                            if (JSON.stringify(response).includes('ok')) {

                                that.emit(':tell', 'Ok, i\'ve created task ' + taskName + ' in your to doist Project ' + projectName);

                                that.attributes['createProject'] = false;
                            }
                        });

                    }
                });
            }
            else {
                // Couldn't find the project
                var speechOutput = 'I couldn\t find a project called ' + projectName + ' in your to doist';

                // Set attributes so we can persist this across the session
                that.attributes['projectName'] = projectName;
                that.attributes['createProject'] = true;
                that.attributes['createTask'] = true;
                that.attributes['taskName'] = taskName;

                // emit the YesIntent, add attributes, pick them up and handle - fall back to AddTaskProjectIntent after
                that.emit(':ask', speechOutput, 'Do you want me to create it?');

            }
        });
    },
    'Unhandled': function () {
        var that = this;

        // Need a better reply/error message
        that.emit(':tell', 'Unhandled', '');

    },
    'AMAZON.NoIntent': function () {
        var that = this;

        var taskName = that.attributes['taskName'];
        if (!that.attributes['createProject']) {
            if (that.attributes['createTask']) {
                if (taskName != null) {

                    // Create the task with no due date/time
                    //Add the task - leave project id empty to add task to inbox
                    todoist.addTaskToProject(this, "", taskName, "").then(function (response) {
                        if (JSON.stringify(response).includes('ok')) {

                            that.emit(':tell', helpers.generateResponse() + ', i\'ve created task ' + taskName + ' in your inbox.');

                            that.attributes['createTask'] = false;
                        }
                    });

                }
            }
        }
        else {
            that.attributes['createProject'] = false;
            that.attributes['createTask'] = false;

            that.emit(':tell', 'Ok, I won\'t create the project or task');
        }

    },
    'TaskDueDateIntent': function () {
        var that = this;
        var taskDate = this.event.request.intent.slots.taskDate.value;

        // Convert and store the task date in the current session
        that.attributes['taskDate'] = moment(taskDate, "YYYY-MM-DD").format("MM/DD/YYYY");

        console.log(that.attributes['taskDate']);

        that.emit(':ask', "Ok, and what time?", "Try saying a time, for example 4pm");
    },
    TaskTimeIntent: function () {
        var that = this;
        var taskTime = this.event.request.intent.slots.taskTime.value;
        var taskName = that.attributes['taskName'];
        var taskDate = that.attributes['taskDate'];

        // Combine task date and task time
        taskDate = taskDate + "T" + taskTime;

        //Add the task - leave project id empty to add task to inbox
        todoist.addTaskToProject(this, "", taskName, taskDate).then(function (response) {
            if (JSON.stringify(response).includes('ok')) {

                that.emit(':tell', 'Ok, i\'ve created task ' + taskName + ' in your inbox.');

                that.attributes['createTask'] = false;
            }
        });

    },
    'AddTaskIntent': function () {
        var that = this;
        var speechOutput = "";
        var reprompt = "";
        var taskName = ((this.event.request.intent.slots) ? this.event.request.intent.slots.taskName.value : that.attributes['taskName']);
        var taskDate = ((this.event.request.intent.slots) ? this.event.request.intent.slots.taskDate.value : that.attributes['taskDate']);
        var taskTime = ((this.event.request.intent.slots) ? this.event.request.intent.slots.taskTime.value : that.attributes['taskTime']);
        taskName = taskName.capitalizeFirstLetter();
        that.attributes['taskName'] = taskName;
        that.attributes['createTask'] = true;

        if (taskDate != null && taskTime != null) {
            taskDate = moment(taskDate).format("DD/MM/YYYY");
            // Convert time as required and add the task
            that.attributes['taskDate'] = taskDate;

        }
        else {
            speechOutput = 'Ok, and what is the due date for the task?';
            reprompt = "If you don't want a due date, say No, or try saying a date, for example tomorrow or Tuesday 2nd";
        }

        that.emit(':ask', speechOutput, reprompt);

    },
    'DeleteTaskIntent': function () {
        var that = this;
        var taskName = ((this.event.request.intent.slots.taskName.value) ? this.event.request.intent.slots.taskName.value : that.attributes['taskName'] = taskName);
        taskName = taskName.capitalizeFirstLetter();

        todoist.getResources(this, "task", taskName).then(function (response) {
            var taskId = findTask(response.items, null, taskName);

            if (taskId) {
                todoist.deleteTask(this, taskId).then(function (response) {
                    if (JSON.stringify(response).includes('ok')) {
                        that.emit(':tell', 'I\'ve deleted task ' + taskName);
                    }
                });
            }

            else {
                // Couldn't find the task - possibly ask to create
                that.emit(':tell', 'Sorry, I couldn\'t find task ' + taskName);
            }

        });

    },
    'CompleteTaskIntent': function () {
        var that = this;
        var taskName = ((this.event.request.intent.slots.taskName.value) ? this.event.request.intent.slots.taskName.value : that.attributes['taskName'] = taskName);
        taskName = taskName.capitalizeFirstLetter();

        todoist.getResources(this, "task", taskName).then(function (response) {
            var taskId = findTask(response.items, null, taskName);

            if (taskId) {
                // Complete the task
                todoist.completeTask(this, taskId).then(function () {

                    var imageObj = {
                        smallImageUrl: 'https://d3ptyyxy2at9ui.cloudfront.net/262ba9000264fb5fe32f55fe9b77be10.svg',
                        largeImageUrl: 'https://d3ptyyxy2at9ui.cloudfront.net/262ba9000264fb5fe32f55fe9b77be10.svg'
                    };

                    that.emit(':tellWithCard', 'Marked task ' + taskName + ' as complete', 'Alexa Todoist', 'Task ' + taskName + ' has been marked as complete.', imageObj)

                });
            }
            else {
                // Couldn't find the task - possibly ask to create
                that.emit(':tell', 'Sorry, I couldn\'t find task ' + taskName);
            }
        });
    },
    'UnCompleteTaskIntent': function () {
        var that = this;
        var taskName = ((this.event.request.intent.slots.taskName.value) ? this.event.request.intent.slots.taskName.value : that.attributes['taskName'] = taskName);
        taskName = taskName.capitalizeFirstLetter();

        todoist.getResources(this, "task", taskName).then(function (response) {
            var taskId = findTask(response.items, null, taskName);
            console.log(taskId);

            if (taskId) {
                // Complete the task
                todoist.unCompleteTask(this, taskId).then(function () {

                    var imageObj = {
                        smallImageUrl: 'https://d3ptyyxy2at9ui.cloudfront.net/262ba9000264fb5fe32f55fe9b77be10.svg',
                        largeImageUrl: 'https://d3ptyyxy2at9ui.cloudfront.net/262ba9000264fb5fe32f55fe9b77be10.svg'
                    };

                    that.emit(':tellWithCard', 'Marked task ' + taskName + ' as uncomplete', 'Alexa Todoist', 'Task ' + taskName + ' has been marked as uncomplete.', imageObj)

                });
            }
            else {
                // Couldn't find the task - possibly ask to create
                that.emit(':tell', 'I couldn\'t find task ' + taskName + ' in your to doist, you may not be a to doist premium user.');
            }
        });

    }
}

String.prototype.capitalizeFirstLetter = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

function clearAttributes() {

}


