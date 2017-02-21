# Todoist Alexa Skill

This is a skill built for Amazon's Alexa service that tells allows you to manage your Todoist Tasks and Projects. 
It was built because the out of the box Alexa Todoist integration is very basic and doesn't allow you to add tasks to projects, create projects, complete tasks etc.

*By default tasks that are added without specifying a project get added to your Inbox.*

You can ask Alexa the following:

Projects:

> Alexa, ask Todoist to create project Home DIY

> Alexa, ask Todoist to create a project called Home DIY

Tasks/Items:

> Alexa, ask Todoist to add {taskName} e.g. Alexa, ask Todoist to add 'Phone the doctors'

> Alexa, ask Tododist to add 'Paint radiator' to project Home DIY

> Alexa, ask Todoist to add 'Paint radiator' for 1st January 2017 at Four PM

> Alexa ask Todoist to add 'Paint radatior' for 1st January 2017

Deleting Tasks/Items:

>Alexa, ask Todoist to delete task Paint radiator

Completing Tasks/Items:

> Alexa, ask Todoist to complete 'Phone the doctors'

> Alexa, ask Todoist to uncomplete task Paint radiator

If you are just starting out developing skills for Alexa, it's worth reading [Getting Started with the Alexa Skills Kit](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/getting-started-guide)
and [Developing an Alexa Skill as a Lambda Function](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/developing-an-alexa-skill-as-a-lambda-function).
Also you may want to get familiar with the [Alexa Skills Kit SDK for Node.js](https://github.com/alexa/alexa-skills-kit-sdk-for-nodejs) which this skill uses.

## Setup

### Creating a Todoist App

Before you can configure the skill, you need to create an App in the Todoist developer site. This will allow the skill full access to your Todoist account.
1. Head over to the [Todoist Developer site](https://developer.todoist.com/appconsole.html)
2. Click 'Create New App' 
3. Give your app a name e.g. alexa-todoist-skill and enter a valid URL (can be anything)
4. Scroll down and click 'Create Test Token'
5. Copy the value shown as you will need this to configure the skill

### Configuring The Skill

1. Copy `default.env` to `.env`
2. Fill in the correct values for `TODOIST_EMAIL`, which is your e-mail address for Todoist, `TODOIST_PASSWORD` which is fairly obvious and `TODOIST_ACCESS_TOKEN` which is the token you copied from the step above. 

### Testing the skill Locally

You can use [lambda-local](https://github.com/ashiina/lambda-local) to test the skill locally. 
In the `test_events` directory you will find event files that you can use for testing, these should map to most of the intents. Some intents require responses so cannot be tested locally unless the code is modified to hardcode various the value of some variables.

To use lambda-local, run `lambda-local -l index.js -e test_events/addtask.json -t 30`, where addtask.json is the name of the event file you want to test with. Make sure you run  `npm install` from the command line to get the latest npm packages first. 

### Packaging the Skill

1. Run an `npm install` at the root folder of the project to get all the dependencies.
2. Run `npm run bundle` which will create a lambda.zip file in the root of the folder.

### Deploying the Skill

The skill is built to be hosted on Amazon's [AWS
Lambda service](https://aws.amazon.com/lambda/). 

1. Go to the [AWS Console](https://console.aws.amazon.com) and click on the 'Lambda' link.
2. Click on the 'Create a Lambda function' button.
3. Skip the blueprint by clicking 'Configture triggers'.
4. Set the trigger to be 'Alexa Skills Kit' and click 'Next'.
4. Give your Lambda function a name e.g. 'Todoist-Skill'.
5. Select the runtime as Node.js
6. Select Code entry type as 'Upload a .ZIP file' and upload the lambda.zip file created above.
7. Keep the Handler as index.handler (this refers to the main js file in the zip).
8. Select "Create a new role from template(s)" and set a role name e.g. 'todoistskill'.
9. Scroll down and click 'Next'.
10. Review the information and click 'Create function'.
11. When the funtion has been created, copy the ARN from the top right to be used later in the Alexa Skill Setup.

*Direct depoyment from the Command line coming soon once I've tested it!*

## Setting up the Skill in Alexa

1. Go to the [Alexa Console](https://developer.amazon.com/edw/home.html) and click 'Add a New Skill'.
2. Set 'Todoist' for the skill name and choose an invocation name, this is what you use to activate your skill - I chose 'to do' as Alexa struggles to understand the phrase 'todoist'!
3. Select the Lambda ARN for the skill Endpoint and paste the ARN copied from above. Click 'Next'.
4. Copy the custom slot types from the customSlotTypes folder. This 'catch all' slot is designed to pick up arbrituary spoken phrases as a replacement for AMAZON.LITERAL which is not available in the UK. 
5. Copy the Intent Schema from the included IntentSchema.json.
6. Copy the Sample Utterances from the included sample_utterances.txt file. Click 'Next'.
7. You are now able to start using the skill! You should be able to go to the [Echo page](http://echo.amazon.com/#skills) and see your skill enabled.
8. In order to test it, try to say some of the Sample Utterances from the Examples above.
9. Repeat the above for each language/region you want to use the skill in. I am based in the UK so use English (UK).

*You will notice that the catchAll slot values above are extremely random - this is deliberate!*
*The LITERAL slot type that allowed any speech to be captured is deprecated. I decided to use Amazon's recommended approach of custom slot types.* 
*Because we are creating tasks/projects which could be called anything we can't define a list of values (which is the way custom slot types work).*
*I've been told you should create a sensible list of possible values but I found Alexa weighted the speech too heavily to these values so random values yielded better results in returning what the user said correctly.*

*Update 21/02/2017 - the LITERAL slot type is back in the US - AMAZON.LITERAL but not for us UK folk! :-(*