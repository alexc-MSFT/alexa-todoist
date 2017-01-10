exports.generateUUID = generateUUID;
exports.generateResponse = generateResponse;

var LAUNCH_DESCRIPTION = exports.LAUNCH_DESCRIPTION = 'This skill allows you to manage your To doist projects and tasks.';

var responsesArray = [
    'OK',
    'Sure',
    'No worries',
    'As you wish',
    'No problem',
    'Affirmative',
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



