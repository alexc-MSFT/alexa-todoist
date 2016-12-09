
var helpers = require('./helpers.js');

exports.buildAddProjectCommand = buildAddProjectCommand;
exports.buildAddTaskCommand = buildAddTaskCommand;
exports.buildGetResourceCommand = buildGetResourceCommand;
exports.buildCompleteTaskCommand = buildCompleteTaskCommand;

function buildAddProjectCommand(projectName) {
    var temp_id = helpers.generateUUID();
    var uuid = helpers.generateUUID();

    var addProjectCommand =
        [{
            "type": "project_add",
            "temp_id": "" + temp_id + "",
            "uuid": "" + uuid + "",
            "args": { "name": "" + projectName + "", "item_order": 1, "indent": 1, "color": 1 }
        }];

    addProjectCommand = JSON.stringify(addProjectCommand);

    return "commands=" + addProjectCommand;
}

function buildAddTaskCommand(taskName, projectId) {
    var temp_id = helpers.generateUUID();
    var uuid = helpers.generateUUID();

    var addTaskCommand =
        [{
            "type": "item_add",
            "temp_id": "" + temp_id + "",
            "uuid": "" + uuid + "",
            "args": { "content": "" + taskName + "", "project_id": "" + projectId + "" }
        }];

    addTaskCommand = JSON.stringify(addTaskCommand);

    return "commands=" + addTaskCommand;
}

function buildCompleteTaskCommand(taskId) {
    var temp_id = helpers.generateUUID();
    var uuid = helpers.generateUUID();

    var completeTaskCommand =
        [{
            "type": "item_complete",
            "temp_id": "" + temp_id + "",
            "uuid": "" + uuid + "",
            "args": { "ids": [taskId] }
        }];

    completeTaskCommand = JSON.stringify(completeTaskCommand);

    return "commands=" + completeTaskCommand;
}

function buildGetResourceCommand(resourceType) {
    switch (resourceType) {
        case "project": {
            return "resource_types=[\"projects\"]"
        }
        case "task": {
            return "resource_types=[\"items\"]"
        }
    }
}

