exports.addProject = addProject;
exports.addTaskToProject = addTaskToProject;
exports.getProjects = getProjects;

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

function getProjects(that, projectName) {

    var url = todoistURL + commands.buildGetResourceCommand("project");
    console.log(url);
    var options = {
        uri: url,
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true // Automatically parses the JSON string in the response
    };

    return request(options);

}

