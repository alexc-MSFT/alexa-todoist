exports.generateUUID = generateUUID;
exports.generateResponse = generateResponse;
exports.findProject = findProject;
exports.findTask = findTask;
exports.findMatchingTask = findMatchingTask;

var LAUNCH_DESCRIPTION = exports.LAUNCH_DESCRIPTION = 'Welcome to flash tasks, this skill allows you to manage your To doist projects and tasks';
var TRY_RESPONSE = exports.TRY_RESPONSE = 'Try saying "Add task call Mark"';
var HELP_RESPONSE = exports.HELP_RESPONSE = 'You can ask flash tasks to add new tasks to your inbox or to projects';
var ERROR_RESPONSE = exports.ERROR_RESPONSE = 'Sorry but something went wrong';

var cardImg = exports.cardImg = {
    smallImageUrl: 'https://s3.eu-west-2.amazonaws.com/alexa-flash-tasks/alexa-flasktasks-logo-small.png',
    largeImageUrl: 'https://s3.eu-west-2.amazonaws.com/alexa-flash-tasks/alexa-flasktasks-logo-large.png'
};

var responsesArray = [
    'OK',
    'Sure',
    'Affirmative',
    'No problem',
    'As you wish',
    'Consider it done',
    'Done',
    'Certainly'
]

function generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
};

function generateResponse() {
    var randomIndex = Math.floor(Math.random() * responsesArray.length);
    var response = responsesArray[randomIndex];
    return response;
}

function clearAttributes(that) {
}


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


function findMatchingTask(tasks, taskName)
{
   var tasksArr = [];
   
   tasksArr = findMyTask(tasksArr, tasks, taskName);

   console.log(tasksArr);

   if (tasksArr["length"] > 0)
   {
       return tasksArr;
   }
   else
   {
        var taskWords = taskName.split(" ");

        for (i = 0; i < taskWords.length; i++)
        {
           tasksArr = findMyTask(tasksArr, tasks, taskWords[i]);
        }  
   }
   
   return tasksArr;

}

function findMyTask(tasksArr, tasks, taskName){

    for (var task in tasks) {
        if (tasks[task].content.toLowerCase().includes(taskName.toLowerCase())) {
            tasksArr.push({id: tasks[task].id, name: tasks[task].content});
        }
        
    }

    return tasksArr;
}


