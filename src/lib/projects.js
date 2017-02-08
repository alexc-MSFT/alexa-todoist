exports.addProject = addProject;

var helpers = require('./helpers.js');
var todoist = require('./todoist.js');

function addProject(that) {
    var projectName = ((that.event.request.intent.slots) ? that.event.request.intent.slots.projectName.value : that.attributes['projectName']);
    projectName = projectName.capitalizeFirstLetter();
    //Check if the project exists
    todoist.getResources(that, "project", projectName).then(function (response) {
        var projectId = helpers.findProject(response.projects, projectName);
        if (projectId) {
            // Found the project - don't create it
            that.emit(':tellWithCard', 'Project ' + projectName + ' already exists in your list of projects, try adding a task to it', 'Flash Tasks', 'Project ' + projectName + ' already exists', helpers.cardImg);
        }
        else {
            todoist.addProject(that, projectName).then(function (response) {
                // Identify if the todoist response is valid - includes uuid and 'ok'
                if (JSON.stringify(response).includes('"' + that.attributes["uuid"] + '":"ok"')) {
                    // Check if the sync_status returned ok
                    if (that.attributes['createTask']) {
                        that.emit('AddTaskProjectIntent');
                    }
                    else {
                        var createdResponse =
                            that.emit(':tellWithCard', helpers.generateResponse() + ', i\'ve created project ' + projectName + ' in your to doist', 'Flash Tasks', 'Project ' + projectName + ' has been created in your Todoist.', helpers.cardImg);
                    }
                }
                that.emit(':tell', helpers.ERROR_RESPONSE);
            });
        }
    });
}