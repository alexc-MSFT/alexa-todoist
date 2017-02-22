exports.addProject = addProject;
exports.addTaskToProject = addTaskToProject;
exports.getResources = getResources;
exports.completeTask = completeTask;
exports.unCompleteTask = unCompleteTask;
exports.deleteTask = deleteTask;
exports.getProductivityStats = getProductivityStats;

var commands = require('./commands.js');
var request = require('request-promise');
var config = require('dotenv').config();
var helpers = require('./helpers.js');
var todoistURL = 'https://todoist.com/API/v7/sync?token=' + config.TODOIST_ACCESS_TOKEN + '&sync_token=*&';
var todoistCompletedURL = 'https://todoist.com/API/v7/completed/get_stats?token=' + config.TODOIST_ACCESS_TOKEN;

function addProject(that, projectName) {

    var addProject = commands.buildAddProjectCommand(that, projectName);

    var url = todoistURL + addProject;

    var options = {
        uri: url,
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true // Automatically parses the JSON string in the response
    };

    var todoistRequest = request(options);

    return request(options);
}

function addTaskToProject(that, projectId, taskName, taskDate) {

    // If project id is empty - task will be added to the users inbox
    // Build this and the command out to accept due dates and times

    var url = todoistURL + commands.buildAddTaskCommand(that, taskName, taskDate, projectId);

    var options = {
        uri: url,
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true // Automatically parses the JSON string in the response
    };

    return request(options);
}

function deleteTask(that, taskName, taskId) {

    var url = todoistURL + commands.buildDeleteTaskCommand(that, taskId);

    var options = {
        uri: url,
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true // Automatically parses the JSON string in the response
    };

    request(options)
        .then(function (response) {
            if (JSON.stringify(response).includes('"' + that.attributes["uuid"] + '":"ok"')) {
                that.emit(':tell', helpers.generateResponse() + ", i've deleted task " + taskName);
            }
            else {
                that.emit(':tell', helpers.ERROR_RESPONSE);
            }
        });
}

function completeTask(that, taskName, taskId) {
    var url = todoistURL + commands.buildCompleteTaskCommand(that, taskId);

    var options = {
        uri: url,
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true // Automatically parses the JSON string in the response
    };

    request(options)
        .then(function (response) {

            if (JSON.stringify(response).includes('"' + that.attributes["uuid"] + '":"ok"')) {

                that.emit(':tellWithCard', "Way to go, i've marked task " + taskName + " as complete.", "Flash Tasks", "Task " + taskName + " has been marked as complete.", helpers.cardImg)

            }
            else {
                that.emit(':tell', helpers.ERROR_RESPONSE);
            }

        });
}

function unCompleteTask(that, taskId) {
    var url = todoistURL + commands.buildUncompleteTaskCommand(that, taskId);

    var options = {
        uri: url,
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true // Automatically parses the JSON string in the response
    };

    return request(options);
}

function getResources(that, resourceType, resourceName) {

    var url = todoistURL + commands.buildGetResourceCommand(resourceType);

    var options = {
        uri: url,
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true // Automatically parses the JSON string in the response
    };

    return request(options);
}

function getProductivityStats(that) {

    var options = {
        uri: todoistCompletedURL,
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true // Automatically parses the JSON string in the response
    };

    return request(options);
}
