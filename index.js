'use strict'

var Alexa = require('alexa-sdk');
var moment = require('moment');
var helpers = require('./src/lib/helpers.js');
var todoist = require('./src/lib/todoist.js');
var projects = require('./src/lib/projects.js');
var tasks = require('./src/lib/tasks.js');
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
        //this.emit(':ask', helpers.LAUNCH_DESCRIPTION + "," + helpers.TRY_RESPONSE, helpers.TRY_RESPONSE);
        this.emit(':ask', 'Welcome to flash tasks', '');

    },
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', helpers.HELP_RESPONSE + helpers.TRY_RESPONSE, helpers.TRY_RESPONSE);
    },
    'AMAZON.YesIntent': function () {

        // Check attributes and emit the correct intent
        if (this.attributes["createProject"])
            this.emit('AddProjectIntent');

        if (this.attributes["completeTask"]) {

            // Set attributes for the task to complete;
            this.attributes['matchingTasksIndex'] = 0;
            this.attributes['taskId'] = this.attributes['matchingTasks'][this.attributes['matchingTasksIndex']].id;
            this.attributes['taskName'] = this.attributes['matchingTasks'][this.attributes['matchingTasksIndex']].name;
            this.emit('CompleteTaskIntent');
        }
    },
    'AddProjectIntent': function () {
        try {
            var that = this;
            projects.addProject(that);
        }
        catch (err) {
            that.emit(':tell', helpers.ERROR_RESPONSE + helpers.TRY_RESPONSE);
        }
    },
    'AddTaskProjectIntent': function () {
        try {
            var that = this;
            tasks.addTaskProjectIntent(that);
        }
        catch (err) {
            that.emit(':tell', helpers.ERROR_RESPONSE + helpers.TRY_RESPONSE);
        }
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
                            that.emit(':tell', helpers.ERROR_RESPONSE + helpers.TRY_RESPONSE);
                        }
                    });

                }
            }
            
            // Check if we are completing a task
            if (this.attributes["completeTask"]) {

                if (this.attributes['matchingTasksIndex'] == this.attributes['matchingTasks'].length - 1) {
                    this.emit(':tell', 'I\'m afraid i\'m out of suggestions');
                }
                else {
                    this.attributes['matchingTasksIndex'] = this.attributes['matchingTasksIndex'] + 1;
                    this.emit(':ask', 'Ok, do you mean ' + this.attributes['matchingTasks'][this.attributes['matchingTasksIndex']].name, 'Do you mean ' + this.attributes['matchingTasks'][this.attributes['matchingTasksIndex']].name);
                }
            }
            else {
                that.attributes['createProject'] = false;
                that.attributes['createTask'] = false;

                that.emit(':tell', 'Ok, I won\'t create the project or task');
            }
        }

    },
    'TaskDueDateIntent': function () {
        try {
            var that = this;
            var taskDate = this.event.request.intent.slots.taskDate.value;

            if (taskDate != "") {
                // Convert and store the task date in the current session
                that.attributes['taskDate'] = moment(taskDate, "YYYY-MM-DD").format("MM/DD/YYYY");

                var speechOutput = 'Ok, and what time? If you don\'t want to set a time for the task, say No';
                var reprompt = "If you don't want to set a time, say No, or try saying a time, for example 4pm";

                that.emit(':ask', speechOutput, reprompt);
            }
            else {
                that.emit(':tell', "Sorry I didn't understand that, " + helpers.TRY_RESPONSE);
            }
        }
        catch (err) {
            that.emit(':tell', helpers.ERROR_RESPONSE + helpers.TRY_RESPONSE);
        }

    },
    'TaskTimeIntent': function () {
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

                that.emit(':tell', helpers.ERROR_RESPONSE + helpers.TRY_RESPONSE);
            });
        }
        catch (err) {
            that.emit(':tell', helpers.ERROR_RESPONSE + helpers.TRY_RESPONSE);
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
            speechOutput = "Ok, for what date? If you don't want to set a date, say no.";
            reprompt = "If you don't want to set a date, say no, or try saying a date, for example tomorrow or Tuesday 2nd";
        }

        that.emit(':ask', speechOutput, reprompt);

    },
    'DeleteTaskIntent': function () {
        try {
            var that = this;
            tasks.deleteTask(that);
        }
        catch (err) {
            that.emit(':tell', helpers.ERROR_RESPONSE + helpers.TRY_RESPONSE);
        }
    },
    'CompleteTaskIntent': function () {
        var that = this;
        tasks.completeTask(that);
    },
    'UnCompleteTaskIntent': function () {
        try {
            var that = this;
            tasks.uncompleteTask(that);
        }
        catch (err) {
            that.emit(':tell', helpers.ERROR_RESPONSE + helpers.TRY_RESPONSE);
        }
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


