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
        todoist.addProject(this, projectName).then(function (response) {
            // Check if the sync_status returned ok
            if (JSON.stringify(response).includes('ok')) {
                if (that.attributes['createTask']) { that.emit('AddTaskProjectIntent') };

                that.attributes['createProject'] = false;
                that.emit(':tell', 'Ok, i\'ve created project ' + projectName + ' in your to doist');
            }
        });
    },
    'AddTaskProjectIntent': function () {
        var that = this;
        var projectName = ((this.event.request.intent.slots.projectName.value) ? this.event.request.intent.slots.projectName.value : that.attributes['projectName'] = projectName);
        var taskName = ((this.event.request.intent.slots.taskName.value) ? this.event.request.intent.slots.taskName.value : that.attributes['taskName'] = taskName);
        todoist.getProjects(this, projectName).then(function (response) {
            var projectId = findProject(response.projects, projectName);
            if (projectId) {
                // Found the project - now create the task
                todoist.addTaskToProject(this, projectId, taskName).then(function (response) {
                    if (JSON.stringify(response).includes('ok')) {

                        that.emit(':tell', 'Ok, i\'ve created task ' + taskName + ' in your to doist Project ' + projectName);
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
    }
}

