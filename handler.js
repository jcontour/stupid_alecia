'use strict';

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
         
//     if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app.05aecccb3-1461-48fb-a008-822ddrt6b516") {
//         context.fail("Invalid Application ID");
//      }

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
        + ", sessionId=" + session.sessionId);

    // add any session init logic here
}

/**
 * Called when the user invokes the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId
        + ", sessionId=" + session.sessionId);

    var cardTitle = "Hello, World!"
    var speechOutput = "You can tell Hello, World! to say Hello, World!"
    callback(session.attributes,
        buildSpeechletResponse(cardTitle, speechOutput, "", true));
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId
        + ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    // dispatch custom intents to handlers here
    if (intentName == 'WhatDoYouKnowAbout') {
        var searchtopic = intent.slots.Topic.value;
        
        // handleTestRequest(searchtopic, session, callback);
        //DO THINGS HERE-----------------------------------------------------------------

        callDataMuse(searchtopic, function(resArray){
            // console.log(resArray)

            
            var words = [];
            for (var i = 0; i <= resArray.length - 1; i++) {
                if (resArray[i]['score'] < 95) {
                    words.push(resArray[i]['word']);
                }
            };

            // handleTestRequest(words[0], session, callback);

            callWikipedia(words, function(text){
                // var speech = words[0] + " " + text
                // handleTestRequest(speech, session, callback);
                handleTestRequest(text, session, callback);
            })

        })
        
    }
    else {
        throw "Invalid intent";
    }
}

var https = require('https');

function callDataMuse(topic, callback){
    var endpoint = 'https://api.datamuse.com/words?sl=' + topic // ENDPOINT GOES HERE
    var body = ""
    https.get(endpoint, (response) => {
      response.on('data', (chunk) => { body += chunk })
      response.on('end', () => {
        var data = JSON.parse(body)
        for (var i = 0; i < data.length - 1; i++) {
            var j = i + Math.floor(Math.random() * (data.length - i));

            var temp = data[j];
            data[j] = data[i];
            data[i] = temp;
        }

        callback(data)
      })
    })
}

function callWikipedia(words, callback) {
    // for (var i = 0; i < words.length; i++) {
        var endpoint = 'https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search='+words[0]+'&limit=10&suggest=1&redirects=return' // ENDPOINT GOES HERE
        var body = ""
        https.get(endpoint, (response) => {
          response.on('data', (chunk) => { body += chunk })
          response.on('end', () => {
            var data = JSON.parse(body);

            for (var i = 0; i < data[2].length; i ++){
                if (data[2][i].indexOf("may refer to") == -1 && data[2][i].indexOf("surname") == -1 && data[2][i] != "" && data[2][i].indexOf("redirect") == -1 && data[2][i].indexOf("disambiguation") == -1){
                    var text = "Alecia says she knows about " + data[1][i] + ".... " + data[2][i]
                    text = text.replace(/ \(.*?\)/g, '');
                    text = text.replace(/ \[.*?\]/g, '');
                    callback(text)
                }
            }
          })
        })
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId
        + ", sessionId=" + session.sessionId);

    // Add any cleanup logic here
}

function handleTestRequest(sayThis, session, callback) {
    callback(session.attributes,
        buildSpeechletResponseWithoutCard(sayThis, "", "true"));
}

// ------- Helper functions to build responses -------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}
