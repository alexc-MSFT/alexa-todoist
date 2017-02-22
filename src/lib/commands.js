
var helpers = require('./helpers.js');

exports.buildAddProjectCommand = buildAddProjectCommand;
exports.buildAddTaskCommand = buildAddTaskCommand;
exports.buildGetResourceCommand = buildGetResourceCommand;
exports.buildCompleteTaskCommand = buildCompleteTaskCommand;
exports.buildUncompleteTaskCommand = buildUncompleteTaskCommand;
exports.buildDeleteTaskCommand = buildDeleteTaskCommand;
exports.buildProductivityStatsCommand = buildProductivityStatsCommand;

function buildAddProjectCommand(that, projectName) {
    var temp_id = helpers.generateUUID();
    var uuid = helpers.generateUUID();
    that.attributes["uuid"] = uuid;

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

function buildAddTaskCommand(that, taskName, taskDate, projectId) {
    var temp_id = helpers.generateUUID();
    var uuid = helpers.generateUUID();
    that.attributes["uuid"] = uuid;

    var addTaskCommand =
        [{
            "type": "item_add",
            "temp_id": "" + temp_id + "",
            "uuid": "" + uuid + "",
            "args": { "content": "" + taskName + "", "project_id": "" + projectId + "", "date_string": "" + taskDate }
        }];


    addTaskCommand = JSON.stringify(addTaskCommand);

    return "commands=" + addTaskCommand;
}

function buildDeleteTaskCommand(that, taskId) {
    var temp_id = helpers.generateUUID();
    var uuid = helpers.generateUUID();
    that.attributes["uuid"] = uuid;

    var addTaskCommand =
        [{
            "type": "item_delete",
            "temp_id": "" + temp_id + "",
            "uuid": "" + uuid + "",
            "args": { "ids": [taskId] }
        }];

    addTaskCommand = JSON.stringify(addTaskCommand);

    return "commands=" + addTaskCommand;
}

function buildCompleteTaskCommand(that, taskId) {
    var temp_id = helpers.generateUUID();
    var uuid = helpers.generateUUID();
    that.attributes["uuid"] = uuid;

    var completeTaskCommand =
        [{
            "type": "item_close",
            "temp_id": "" + temp_id + "",
            "uuid": "" + uuid + "",
            "args": { "id": taskId }
        }];

    completeTaskCommand = JSON.stringify(completeTaskCommand);

    return "commands=" + completeTaskCommand;
}

function buildUncompleteTaskCommand(that, taskId) {
    var temp_id = helpers.generateUUID();
    var uuid = helpers.generateUUID();
    that.attributes["uuid"] = uuid;

    var uncompleteTaskCommand =
        [{
            "type": "item_uncomplete",
            "temp_id": "" + temp_id + "",
            "uuid": "" + uuid + "",
            "args": { "ids": + "" + taskId + "" },
            "restore_stat": {}
        }];

    uncompleteTaskCommand = JSON.stringify(uncompleteTaskCommand);

    return "commands=" + uncompleteTaskCommand;
}

function buildProductivityStatsCommand(that)
{
    return "/completed/get_stats";
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

