'use strict'

var Alexa = require('alexa-sdk');
var moment = require('moment');
var helpers = require('./src/lib/helpers.js');
var todoist = require('./src/lib/todoist.js');
var projects = require('./src/lib/projects.js')
var config = require('dotenv').config();

var cardImage = {
    smallImageUrl: 'https://d3ptyyxy2at9ui.cloudfront.net/262ba9000264fb5fe32f55fe9b77be10.svg',
    largeImageUrl: 'https://d3ptyyxy2at9ui.cloudfront.net/262ba9000264fb5fe32f55fe9b77be10.svg'
};

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

// Combine these methods
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

// Split out each handler method into seperate files
var handlers = {
    'LaunchRequest': function () {
        this.emit(':ask', helpers.LAUNCH_DESCRIPTION, helpers.TRY_RESPONSE);

    },
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', helpers.HELP_RESPONSE, helpers.TRY_RESPONSE);
    },
    'AMAZON.YesIntent': function () {

        // Check attributes and emit the correct intent
        if (this.attributes["createProject"])
            this.emit('AddProjectIntent');
    },
    'AddProjectIntent': function () {
        try {
            console.log(this);
            var that = this;
            projects.addProject(that);
        }
        catch (err) {
            that.emit(':tell', helpers.ERROR_RESPONSE);
        }
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
                            if (JSON.stringify(response).includes('"' + that.attributes["uuid"] + '":"ok"')) {

                                that.emit(':tell', helpers.generateResponse() + ', i\'ve created task ' + taskName + ' in your to doist Project ' + projectName);

                                that.attributes['createProject'] = false;
                            }
                            else {
                                that.emit(':tell', helpers.ERROR_RESPONSE);
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

        // Phrase was unhandled - reply with error response
        that.emit(':tell', helpers.ERROR_RESPONSE);

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
                        if (JSON.stringify(response).includes('"' + that.attributes["uuid"] + '":"ok"')) {

                            that.emit(':tell', helpers.generateResponse() + ', i\'ve created task ' + taskName + ' in your inbox.');

                            that.attributes['createTask'] = false;
                        }
                        else {
                            that.emit(':tell', helpers.ERROR_RESPONSE);
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
        try {
            var that = this;
            var taskDate = this.event.request.intent.slots.taskDate.value;

            // Convert and store the task date in the current session
            that.attributes['taskDate'] = moment(taskDate, "YYYY-MM-DD").format("MM/DD/YYYY");

            console.log(that.attributes['taskDate']);

            speechOutput = 'Ok, and what time? If you don\'t want to set a time for the task, say No';
            reprompt = "If you don't want to set a time, say No, or try saying a time, for example 4pm";

            that.emit(':ask', speechOutput, reprompt);
        }
        catch (err) {
            that.emit(':tell', helpers.ERROR_RESPONSE);
        }

    },
    TaskTimeIntent: function () {
        try {

            var that = this;
            var taskTime = this.event.request.intent.slots.taskTime.value;
            var taskName = that.attributes['taskName'];
            var taskDate = that.attributes['taskDate'];

            // Combine task date and task time
            taskDate = taskDate + "T" + taskTime;

            //Add the task - leave project id empty to add task to inbox
            todoist.addTaskToProject(this, "", taskName, taskDate).then(function (response) {
                if (JSON.stringify(response).includes('"' + that.attributes["uuid"] + '":"ok"')) {
                    that.attributes['createTask'] = false;
                    that.emit(':tell', helpers.generateResponse() + ', i\'ve created task ' + taskName + ' in your inbox.');

                    that.attributes['createTask'] = false;
                }

                that.emit(':tell', helpers.ERROR_RESPONSE);
            });
        }
        catch (err) {
            that.emit(':tell', helpers.ERROR_RESPONSE);
        }

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
            // Convert time as required and add the task - todo
            that.attributes['taskDate'] = taskDate;

        }
        else {
            speechOutput = "Ok, and what is the due date for the task? If you don't want a due date, say No.";
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
                    if (JSON.stringify(response).includes('"' + that.attributes["uuid"] + '":"ok"')) {
                        that.emit(':tell', helpers.generateResponse() + ", i've deleted task " + taskName);
                    }

                    this.emit(':tell', helpers.ERROR_RESPONSE);
                });
            }

            else {
                // Couldn't find the task - possibly ask to create
                that.emit(':tell', "Sorry, I couldn't find task " + taskName);
            }

        });

    },
    'CompleteTaskIntent': function () {
        var that = this;
        var taskName = ((this.event.request.intent.slots.taskName.value) ? this.event.request.intent.slots.taskName.value : that.attributes['taskName'] = taskName);
        taskName = taskName.capitalizeFirstLetter();

        try {

            todoist.getResources(this, "task", taskName).then(function (response) {
                if (JSON.stringify(response).includes('ok')) {
                    var taskId = findTask(response.items, null, taskName);
                    if (taskId) {
                        // Complete the task
                        todoist.completeTask(that, taskId).then(function (response) {
                            // Identify if the todoist response is valid - includes uuid and 'ok'
                            if (JSON.stringify(response).includes('"' + that.attributes["uuid"] + '":"ok"')) {

                                var imageObj = {
                                    smallImageUrl: 'https://d3ptyyxy2at9ui.cloudfront.net/262ba9000264fb5fe32f55fe9b77be10.svg',
                                    largeImageUrl: 'https://d3ptyyxy2at9ui.cloudfront.net/262ba9000264fb5fe32f55fe9b77be10.svg'
                                };

                                that.emit(':tellWithCard', "Way to go, i've marked task " + taskName + " as complete.", "Flash tasks", "Task " + taskName + " has been completed.", imageObj)

                            }
                            else {
                                that.emit(':tell', helpers.ERROR_RESPONSE);
                            }
                        });
                    }
                    else {
                        // Couldn't find the task - possibly ask to create
                        that.emit(':tell', 'Sorry, I couldn\'t find task ' + taskName);
                    }
                }
                else {
                    that.emit(':tell', helpers.ERROR_RESPONSE);
                }

            });
        }
        catch (err) {
            that.emit(':tell', helpers.ERROR_RESPONSE);
        }
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
                todoist.unCompleteTask(this, taskId).then(function (response) {
                    if (JSON.stringify(response).includes('"' + that.attributes["uuid"] + '":"ok"')) {
                        var imageObj = {
                            smallImageUrl: 'https://d3ptyyxy2at9ui.cloudfront.net/262ba9000264fb5fe32f55fe9b77be10.svg',
                            largeImageUrl: 'https://d3ptyyxy2at9ui.cloudfront.net/262ba9000264fb5fe32f55fe9b77be10.svg'
                        };

                        that.emit(':tellWithCard', 'Ok, i\'ve marked task ' + taskName + ' as uncomplete', 'Alexa Todoist', 'Task ' + taskName + ' has been marked as uncomplete.', imageObj)
                    }

                    that.emit(':tell', helpers.ERROR_RESPONSE);
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

function isError(response) {
    if (JSON.stringify(response).includes("sync_status") && JSON.stringify(response).includes('ok')) {

    }

}


