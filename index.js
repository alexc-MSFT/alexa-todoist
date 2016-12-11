'use strict'

var Alexa = require('alexa-sdk');
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
        if (this.attributes["createProject"])
            this.emit('AddProjectIntent');
    },
    'AddProjectIntent': function () {
        var that = this;
        var projectName = ((this.event.request.intent.slots.projectName.value) ? this.event.request.intent.slots.projectName.value : that.attributes['projectName'] = projectName);
        projectName = projectName.capitalizeFirstLetter()
        // Check if the project exists
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
                        if (that.attributes['createTask']) { that.emit('AddTaskProjectIntent') };
                        that.attributes['createProject'] = false;
                        that.emit(':tell', 'Ok, i\'ve created project ' + projectName + ' in your to doist');
                    }
                });
            }
        });


    },
    'AddTaskProjectIntent': function () {
        var that = this;
        var projectName = ((this.event.request.intent.slots.projectName.value) ? this.event.request.intent.slots.projectName.value : that.attributes['projectName'] = projectName);
        var taskName = ((this.event.request.intent.slots.taskName.value) ? this.event.request.intent.slots.taskName.value : that.attributes['taskName'] = taskName);
        taskName = taskName.capitalizeFirstLetter()
        projectName = projectName.capitalizeFirstLetter()

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
                            }
                        });

                    }
                });
            }
            else {
                // Couldn't find the project - create it
                var speechOutput = 'I couldn\t find a project called ' + projectName + 'in your to doist';

                // Set attributes so we can persist this across the session
                that.attributes['projectName'] = projectName;
                that.attributes['createProject'] = true;
                that.attributes['createTask'] = true;
                that.attributes['taskName'] = taskName;

                // emit the YesIntent, add attributes, pick them up and handle - fall back to AddTaskProjectIntent after
                //that.emit('AMAZON.YesIntent');
                that.emit(':ask', speechOutput, 'Do you want me to create it?');

            }
        });
    },
    'DeleteTaskIntent': function () {
        var that = this;
        var taskName = ((this.event.request.intent.slots.taskName.value) ? this.event.request.intent.slots.taskName.value : that.attributes['taskName'] = taskName);
        taskName = taskName.capitalizeFirstLetter();

        todoist.getResources(this, "task", taskName).then(function (response) {
            var taskId = findTask(response.items, null, taskName);
            console.log(taskId);

            if (taskId) {
                todoist.deleteTask(this, taskId).then(function (response) {
                    if (JSON.stringify(response).includes('ok')) {
                        that.emit(':tell', 'I\'ve deleted task ' + taskName);
                    }
                });
            }

            else {
                // Couldn't find the task - possibly ask to create
                that.emit(':tell', 'I couldn\'t find task ' + taskName + ' in your to doist.');
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
                that.emit(':tell', 'I couldn\'t find task ' + taskName + ' in your to doist.');
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
                that.emit(':tell', 'I couldn\'t find task ' + taskName + ' in your to doist, you may not be a todo ist premium user.');
            }
        });

    }
}

String.prototype.capitalizeFirstLetter = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
}


