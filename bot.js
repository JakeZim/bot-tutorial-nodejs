import * as abilities from './abilities.js';

var HTTPS = require('https');
var botID = process.env.BOT_ID;

function respond() {
    var request = JSON.parse(this.req.chunks[0]),
        botRegex = /^[uU]rza ([+-][16])$/,
        rollRegex = /[rR]oll ?[dD]?([0-9]+)/,
        timeRegex = /[tT]imes? ([1-9][1-9]?):?([0-9][0-9])? ?(.*)$/;
    console.log("Trying to respond to request" + request);

    if (request.text && botRegex.test(request.text)) {
        var ability = request.text.match(botRegex)[1],
            message = getResult(ability);
        writeMessage(message);
    } else if (request.text && rollRegex.test(request.text)) {
        var die = request.text.match(rollRegex)[1];
        writeMessage(roll(die));
    } else if (request.text && timeRegex.test(request.text)) {
        var hour = request.text.match(timeRegex)[1];
        var minutes = request.text.match(timeRegex)[2];
        var tz = request.text.match(timeRegex)[3];
        var times = getTimes(hour, minutes, tz);
        var message = times[0] + '\n' + times[1] + '\n' + times[2];
        writeMessage(message);
    } else {
        //console.log("don't care");
    }
}

function writeMessage(message)
{
    this.res.writeHead(200);
    postMessage();
    this.res.end();
}

function getTimes(hour, minutes, tz)
{
    hour = Number(hour);
    //console.log("Getting times for " + hour + ":" + minutes + " " + tz);
    var est, cst, pst;
    var upperTZ = tz.toUpperCase();
    if (upperTZ == "EST" || upperTZ == "ET") {
        est = hour;
        cst = hour - 1;
        pst = hour - 3;
    } else if  (upperTZ == "CST" || upperTZ == "CT") {
        est = hour + 1;
        cst = hour;
        pst = hour - 2;
    } else if (upperTZ == "PST" || upperTZ == "PT") {
        est = hour + 3;
        cst = hour + 2;
        pst = hour;
    }
    //console.log(est + "," + cst + "," + pst);
    est = goAround(est);
    cst = goAround(cst);
    pst = goAround(pst);
    //console.log(est + "," + cst + "," + pst);
    var estTime, cstTime, pstTime;
    if(minutes === undefined)
    {
        estTime = String(est) + " EST";
        cstTime = String(cst) + " CST";
        pstTime = String(pst) + " PST";
    } else {
        estTime = String(est) + ":" + String(minutes) + " EST";
        cstTime = String(cst) + ":" + String(minutes) + " CST";
        pstTime = String(pst) + ":" + String(minutes) + " PST";
    }
    //console.log(estTime + "," + cstTime + "," + pstTime);
    return [estTime,cstTime,pstTime];
}

function goAround(hour)
{
    hour = Number(hour);
    //Can't have negative times, and definitely not army times (1300+)
    if (hour <= 0) {
        return 12 + hour;
    } else if (hour > 12) {
        return hour - 12;
    }
    return hour;
}

function getResult(ability) {
    var roll20 = roll(20) - 1;
    switch (ability) {
        case "+1":
            return abilities.plusOnes[roll20];
        case "-1":
            return abilities.minusOnes[roll20];
        case "-6":
            return abilities.minusSixes[roll20];
    }
}

function roll(die)
{
    return Math.floor(Math.random() * die) + 1;
}

function postMessage(message) {
    var options, body, botReq;

    options = {
        hostname: 'api.groupme.com',
        path: '/v3/bots/post',
        method: 'POST'
    };

    body = {
        "bot_id": botID,
        "text": String(message)
    };

    console.log('sending ' + message + ' to ' + botID);

    botReq = HTTPS.request(options, function (res) {
        if (res.statusCode == 202) {
            //neat
        } else {
            console.log('rejecting bad status code ' + res.statusCode);
        }
    });

    botReq.on('error', function (err) {
        console.log('error posting message ' + JSON.stringify(err));
    });
    botReq.on('timeout', function (err) {
        console.log('timeout posting message ' + JSON.stringify(err));
    });
    botReq.end(JSON.stringify(body));
}


exports.respond = respond;