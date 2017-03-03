'use strict'

var Alexa = require('alexa-sdk');
var moment = require('moment');
var helpers = require('./src/lib/helpers.js');
var todoist = require('./src/lib/todoist.js');
var projects = require('./src/lib/projects.js');
var tasks = require('./src/lib/tasks.js');
var productivity = require('./src/lib/productivity.js');
var config = require('dotenv').config();

exports.handler = function (event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.registerHandlers(handlers);
    alexa.execute();
};

// Split out each handler method into seperate files
var handlers = {
    'LaunchRequest': function () {
        this.emit(':ask', helpers.LAUNCH_DESCRIPTION + "," + helpers.TRY_RESPONSE, helpers.TRY_RESPONSE);

    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', helpers.CANCEL_RESPONSE);
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', helpers.CANCEL_RESPONSE);
    },
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', helpers.HELP_RESPONSE + helpers.TRY_RESPONSE, helpers.TRY_RESPONSE);
    },
    'AMAZON.YesIntent': function () {

        // Check attributes and emit the correct intent
        if (this.attributes['createProject'])
            this.emit('AddProjectIntent');

        if (this.attributes['matchingTasks'] != undefined) {

            if (this.attributes['matchingTasksIndex'] == undefined) {
                console.log("Test");
                this.attributes['matchingTasksIndex'] = 0;
            }

            this.attributes['taskId'] = this.attributes['matchingTasks'][this.attributes['matchingTasksIndex']].id;
            this.attributes['taskName'] = this.attributes['matchingTasks'][this.attributes['matchingTasksIndex']].name;

            if (this.attributes["completeTask"]) {
                this.emit('CompleteTaskIntent');
            }

            if (this.attributes['deleteTask']) {
                this.emit('DeleteTaskIntent');
            }
        }
    },
    'AddProjectIntent': function () {
        try {
            var that = this;
            projects.addProject(that);
        }
        catch (err) {
            that.emit(':tell', helpers.ERROR_RESPONSE);
        }
    },
    'AddTaskProjectIntent': function () {
        try {
            var that = this;
            tasks.addTaskProjectIntent(that);
        }
        catch (err) {
            that.emit(':tell', helpers.ERROR_RESPONSE);
        }
    },
    'Unhandled': function () {
        var that = this;

        // Intent was unhandled - reply with error response
        // that.emit(':tell', helpers.ERROR_RESPONSE);
        that.emit(':tell', "Unhandled");

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

            that.emit(':tell', 'Ok, I won\'t create the project.');
        }

        // **Check if we are completing or deleting task - could just check if the array attribute is populated?**
        if (this.attributes["completeTask"] || this.attributes["deleteTask"]) {

            if (this.attributes['matchingTasksIndex'] == this.attributes['matchingTasks'].length - 1) {
                this.emit(':tell', 'I\'m afraid i\'m out of suggestions');
            }
            else {
                this.attributes['matchingTasksIndex'] = this.attributes['matchingTasksIndex'] + 1;
                this.emit(':ask', 'Ok, do you mean ' + this.attributes['matchingTasks'][this.attributes['matchingTasksIndex']].name + ' ?', 'Do you mean ' + this.attributes['matchingTasks'][this.attributes['matchingTasksIndex']].name + ' ?');
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
                that.emit(':tell', 'Sorry I didn\'t understand that, ' + helpers.TRY_RESPONSE);
            }
        }
        catch (err) {
            that.emit(':tell', helpers.ERROR_RESPONSE);
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

        todoist.getResources(that, "task", taskName).then(function (response) {
            var taskId = helpers.findTask(response.items, null, taskName);
            console.log(taskId);

            if (!taskId) {

                that.attributes['taskName'] = taskName;
                that.attributes['createTask'] = true;

                if (taskDate != null && taskTime != null) {
                    taskDate = moment(taskDate).format("DD/MM/YYYY");
                    // Convert time as required and add the task - todo
                    that.attributes['taskDate'] = taskDate;

                }
                else {
                    speechOutput = 'Ok, for what date? If you don\'t want to set a date, say No';
                    reprompt = 'If you don\'t want to set a date, say No, or try saying a date, for example tomorrow or Tuesday 2nd';

                    that.emit(':ask', speechOutput, reprompt);
                }
            }
            else {
                that.emit(':tellWithCard', 'Task ' + taskName + ' already exists in your list, try adding a task to it', 'Flash Tasks', 'Task ' + taskName + ' already exists in your Todoist.', helpers.cardImg);
            }
        });
    },
    'DeleteTaskIntent': function () {
        try {
            var that = this;
            tasks.deleteTask(that);
        }
        catch (err) {
            that.emit(':tell', helpers.ERROR_RESPONSE);
        }
    },
    'CompleteTaskIntent': function () {
        try {
            var that = this;
            tasks.completeTask(that);
        }
        catch (err) {
            that.emit(':tell', helpers.ERROR_RESPONSE);
        }
    },
    'UnCompleteTaskIntent': function () {
        try {
            var that = this;
            tasks.uncompleteTask(that);
        }
        catch (err) {
            that.emit(':tell', helpers.ERROR_RESPONSE);
        }
    },
    'KarmaScoreIntent': function () {
        try {
            var that = this;
            productivity.getKarmaScore(that);
        }
        catch (err) {
            that.emit(':tell', helpers.ERROR_RESPONSE);
        }
    }
}

String.prototype.capitalizeFirstLetter = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

