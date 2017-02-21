exports.deleteTask = deleteTask;
exports.completeTask = completeTask;
exports.uncompleteTask = uncompleteTask;

var helpers = require('./helpers.js');
var todoist = require('./todoist.js');

// **Change to a generic 'processtask' method for delete, complete and uncomplete**
function deleteTask(that) {
    var taskName = ((that.event.request.intent.slots) ? that.event.request.intent.slots.taskName.value : that.attributes['taskName']);
    var taskId = (that.attributes['taskId']);
    taskName = taskName.capitalizeFirstLetter();

    if (!taskId) {
        todoist.getResources(that, "task", taskName).then(function (response) {

            var taskId = helpers.findTask(response.items, null, taskName);
            if (taskId) {
                // Mark task as complete
                todoist.deleteTask(that, taskName, taskId);
            }
            else {
                var tasksArr = helpers.findMatchingTask(response.items, taskName);
                if (tasksArr["length"] > 0) {
                    that.attributes['deleteTask'] = true;
                    that.attributes['matchingTasks'] = tasksArr;
                    that.attributes['matchingTasksIndex'] = 0;

                    that.emit(':ask', 'I found ' + tasksArr.length + ' matching tasks, do you mean ' + tasksArr[0].name, 'Do you mean ' + tasksArr[0].name);
                }
                else {
                    //Couldn't find the task - possibly ask to create
                    that.emit(':tell', 'Sorry, I couldn\'t find task ' + taskName);
                }
            }

        });
    }
    else {
        //Mark task as complete
        todoist.deleteTask(that, taskName, taskId);
    }
}

function completeTask(that) {
    // Replace retrieval of intent slot with helper method
    var taskName = ((that.event.request.intent.slots) ? that.event.request.intent.slots.taskName.value : that.attributes['taskName']);
    var taskId = (that.attributes['taskId']);
    taskName = taskName.capitalizeFirstLetter();
    
    if (!taskId) {
        todoist.getResources(that, "task", taskName).then(function (response) {

            var taskId = helpers.findTask(response.items, null, taskName);
            if (taskId) {
                // Mark task as complete
                todoist.completeTask(that, taskName, taskId);
            }
            else {
                var tasksArr = helpers.findMatchingTask(response.items, taskName);
                if (tasksArr["length"] > 0) {
                    that.attributes['completeTask'] = true;
                    that.attributes['matchingTasks'] = tasksArr;
                    that.attributes['matchingTasksIndex'] = 0;

                    that.emit(':ask', 'I found ' + tasksArr.length + ' matching tasks, do you mean ' + tasksArr[0].name, 'Do you mean ' + tasksArr[0].name);
                }
                else {
                    //Couldn't find the task - possibly ask to create
                    that.emit(':tell', 'Sorry, I couldn\'t find task ' + taskName);
                }
            }

        });
    }
    else {
        //Mark task as complete
        todoist.completeTask(that, taskName, taskId);
    }
}
function uncompleteTask(that) {
    var taskName = ((that.event.request.intent.slots.taskName.value) ? that.event.request.intent.slots.taskName.value : that.attributes['taskName'] = taskName);
    taskName = taskName.capitalizeFirstLetter();

    todoist.getResources(that, "task", taskName).then(function (response) {
        var taskId = helpers.findTask(response.items, null, taskName);

        if (taskId) {
            // Mark task as uncomplete
            todoist.unCompleteTask(that, taskId).then(function (response) {
                if (JSON.stringify(response).includes('"' + that.attributes["uuid"] + '":"ok"')) {

                    that.emit(':tellWithCard', 'Ok, i\'ve marked task ' + taskName + ' as uncomplete', 'Flash Tasks', 'Task ' + taskName + ' has been marked as uncomplete.', helpers.cardImg)
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

function addTaskProjectIntent(that) {
    var projectName = ((that.event.request.intent.slots) ? that.event.request.intent.slots.projectName.value : that.attributes['projectName']);
    var taskName = ((that.event.request.intent.slots) ? that.event.request.intent.slots.taskName.value : that.attributes['taskName']);

    todoist.getResources(that, "project", projectName).then(function (response) {
        var projectId = findProject(response.projects, projectName);
        if (projectId) {

            todoist.getResources(that, "task", taskName).then(function (response) {
                var taskId = findTask(response.items, projectId, taskName);

                if (taskId) {
                    that.emit(':tell', 'Task ' + taskName + ' already exists in Project ' + projectName + ', try completing this task or adding a new one.');
                }
                else {
                    // Found the project - now create the task
                    todoist.addTaskToProject(that, projectId, taskName).then(function (response) {
                        if (JSON.stringify(response).includes('"' + that.attributes["uuid"] + '":"ok"')) {

                            that.emit(':tell', helpers.generateResponse() + ', i\'ve created task ' + taskName + ' in your to doist Project ' + projectName);

                            that.attributes['createProject'] = false;
                        }
                        else {
                            that.emit(':tell', helpers.ERROR_RESPONSE + helpers.TRY_RESPONSE);
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
}