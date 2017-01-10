// For more information about this template visit http://aka.ms/azurebots-node-qnamaker

"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var builder_cognitiveservices = require("botbuilder-cognitiveservices");
var request = require('request');


var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);

//var recognizer = new builder_cognitiveservices.QnAMakerRecognizer({
      //          knowledgeBaseId: process.env.QnAKnowledgebaseId, 
//    subscriptionKey: process.env.QnASubscriptionKey});
var recognizer = new builder.LuisRecognizer('https://api.projectoxford.ai/luis/v2.0/apps/a03a7e51-dd74-401d-bbe9-071134809292?subscription-key=319a73d29574452fb76a949ea4d42a5e&verbose=true');
var intents = new builder.IntentDialog({ recognizers: [recognizer] });


var recognizerqna = new builder_cognitiveservices.QnAMakerRecognizer({
            knowledgeBaseId: "03d2ac21-ace5-4cbf-88ac-d0e272037e1b", 
    subscriptionKey: "9e13de47c0cd4210b08592d36559fbd6"});

var basicQnAMakerDialog = new builder_cognitiveservices.QnAMakerDialog({
   recognizers: [recognizerqna],
                defaultMessage: 'No match! Try changing the query terms!',
                qnaThreshold: 0.3}
);

bot.dialog('/', intents);

intents.matches('qna', '/qna');
intents.matches('Converse', '/converse');

intents.matches('profile', '/profile');

intents.matches('repeat', '/repeat');
intents.onDefault(builder.DialogAction.send("I'm sorry. I didn't understand."));

//bot.dialog('/qna', basicQnAMakerDialog);

bot.dialog('/qna', [
    function (session) {
       // builder.Prompts.text(session, 'Hi! What is your name?');
        //session.send("What's ur query?");
        builder.Prompts.text(session, 'Ask me anything!');
     //  session.beginDialogue(basicQnAMakerDialog);
        //session.endDialog();

   },  function (session, results) {
       
       
       var postBody = '{"question":"' + results.response + '"}';
            request({
                url: "https://westus.api.cognitive.microsoft.com/qnamaker/v1.0/knowledgebases/03d2ac21-ace5-4cbf-88ac-d0e272037e1b/generateAnswer",
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Ocp-Apim-Subscription-Key': "9e13de47c0cd4210b08592d36559fbd6"
                },
                body: postBody
            },
                function (error, response, body) {
                    var result;
                       // console.log(body);
                            result = JSON.parse(body);
                            result.score = result.score / 100;
                         //   result.answer = htmlentities.decode(result.answer);
                            session.send(result.answer);
                }
            );


   //session.send(results.response);
        session.endDialog();
    }
    ]);
//bot.dialog('/qna', basicQnAMakerDialog);
bot.dialog('/repeat', [
    function (session) {
        builder.Prompts.text(session, 'Hi! I repeat everything!');
       //session.send("What's ur query?");
        //session.beginDialogue(basicQnAMakerDialog);
    },
    function (session, results) {
        session.send(results.response);
        session.endDialog();
    }
]);
bot.dialog('/converse', [
    function (session) {
       // session.send(session.userData.name);
        var task = builder.EntityRecognizer.findEntity(args.entities, 'convtopic');
        if (!task) {
            builder.Prompts.text(session, "What would you like to talk about?");
        } else {
            next({ response: task.entity });
        }
       // builder.Prompts.text(session, 'Hi! I repeat everything!');
       //session.send("What's ur query?");
        //session.beginDialogue(basicQnAMakerDialog);
    },
    function (session, results) {
        session.send("Yes"+ session.userData.name+" I do like talking about " + results.response);
        session.endDialog();
    }
]);
bot.dialog('/profile', [
    function (session, args, next) {
        session.dialogData.profile = args || {};
        if (!session.userData.name) {
            builder.Prompts.text(session, "What's your name?");
        } else {
            next();
        }
    },
    function (session, results, next) {
        if (results.response) {
            session.userData.name = results.response;
        }
        if (!session.dialogData.profile.company) {
            builder.Prompts.text(session, "What your entry number?");
        } else {
            next();
        }
    },
    function (session, results) {
        if (results.response) {
            session.userData.en = results.response;
        }
        session.endDialogWithResult({ response: session.userData });
    }
]);
//bot.dialog('/', basicQnAMakerDialog);

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}
