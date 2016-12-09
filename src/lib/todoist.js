exports.addProject = addProject;
exports.addTaskToProject = addTaskToProject;
exports.getResources = getResources;
exports.completeTask = completeTask;

var commands = require('./commands.js');
var request = require('request-promise');
var config = require('dotenv').config();
var todoistURL = 'https://todoist.com/API/v7/sync?token=' + config.TODOIST_ACCESS_TOKEN + '&sync_token=*&';

function addProject(that, projectName) {

    var addProject = commands.buildAddProjectCommand(projectName);

    var url = todoistURL + addProject;

    var options = {
        uri: url,
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true // Automatically parses the JSON string in the response
    };

    return request(options);
}

function addTaskToProject(that, projectId, taskName) {

    var url = todoistURL + commands.buildAddTaskCommand(taskName, projectId);

    var options = {
        uri: url,
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true // Automatically parses the JSON string in the response
    };

    return request(options);
}

function completeTask(that, taskId) {
    var url = todoistURL + commands.buildCompleteTaskCommand(taskId);

    var options = {
        uri: url,
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true // Automatically parses the JSON string in the response
    };

    console.log(url);

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
