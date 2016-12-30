var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var app = express();

/*
 app.get('/scrape', function(req, res){
 // Let's scrape UTS subjects from each faculty.

 url = 'http://www.imdb.com/title/tt1229340/';

 request(url, function(error, response, html){
 if(!error){
 var $ = cheerio.load(html);

 var title, release, rating;
 var json = { title : "", release : "", rating : ""};

 $('.title_wrapper').filter(function(){
 var data = $(this);
 title = data.children().first().text().trim();
 release = data.children().last().children().last().text().trim();

 json.title = title;
 json.release = release;
 })

 $('.ratingValue').filter(function(){
 var data = $(this);
 rating = data.text().trim();

 json.rating = rating;
 })
 }

 fs.writeFile('output.json', JSON.stringify(json, null, 4), function(err){
 console.log('File successfully written! - Check your project directory for the output.json file');
 })

 res.send('Check your console!')
 })
 })

 app.listen('8081')
 console.log('Magic happens on port 8081');
 exports = module.exports = app;
 */

// Let's save publicly available subjects data from the UTS website.
app.get('/scrape', function (req, res) {
    const rootUrl = 'http://www.handbook.uts.edu.au/';
    const subjectsListUrl = '/lists/alpha';
    const subjectUrl = 'subjects/';
    const subjectDetailsUrl = 'details/';
    var json = {
        utsSubjects: {},
        adsFaculty: [],
        busFaculty: [],
        commFaculty: [],
        ciiFaculty: [],
        dabFaculty: [],
        eduFaculty: [],
        engFaculty: [],
        healthFaculty: [],
        healthGemFaculty: [],
        itFaculty: [],
        intlFaculty: [],
        lawFaculty: [],
        sciFaculty: [],
        tdiFaculty: []
    };
    var index = -1;

    var facultyQueue = async.queue(function (task, done) {
        request(rootUrl + task.faculty + subjectsListUrl, function (error, response, html) {
            if (error) return done(error);
            if (response.statusCode != 200) return done(response.statusCode);
            var $ = cheerio.load(html);

            var subjectQueue = async.queue(function (task, done) {
                request(rootUrl + subjectUrl + task.number, function (error, response, html) {
                    if (error) return done(error);
                    if (response.statusCode != 200) return done(response.statusCode);
                    var $ = cheerio.load(html);
                    index++;

                    $('.ie-images').filter(function () {
                        var data2 = $(this);
                        var name = data2.children().eq(0).text().replace(/^[0-9]*/, '').trim();
                        var number = task.number;
                        var credits = data2.children().eq(1).text().trim();
                        var h3List = data2.find('h3');
                        var description = "";
                        for (var i = 0; i < h3List.length; i++) {
                            if (h3List.eq(i).text() === "Description") {
                                description = h3List.eq(i).next().next().text().trim();
                            }
                        }
                        var handbookLink = rootUrl + subjectUrl + subjectDetailsUrl + task.number;

                        var subjectId = "sub" + index;
                        json.utsSubjects[subjectId] = {
                            "name": name,
                            "number": number,
                            "credits": credits,
                            "description": description,
                            "handbookLink": handbookLink
                        };

                        var facultySubjects = task.faculty + 'Faculty';
                        json[facultySubjects].push(subjectId);

                        fs.writeFile('output.json', JSON.stringify(json, null, 4), function (err) {
                            if (!err) {
                                console.log('faculty: ' + task.faculty + ' - subject: ' + number);
                                if (task.faculty === 'ads' && task.subjectIndex === task.subjectLastIndex) {
                                    console.log('COMPLETE.');
                                }
                            } else {
                                console.log('Something went wrong when writing to output.json :I');
                            }
                        });
                    });
                    done();
                });
            });
            $('.ie-images').filter(function () {
                var data = $(this);
                var subjectNumList = getFacultySubjectNumbers(data);
                for (var j = 0; j < subjectNumList.length; j++) {
                    subjectQueue.push({
                        number: subjectNumList[j],
                        faculty: task.faculty,
                        subjectIndex: j,
                        subjectLastIndex: subjectNumList.length - 1
                    });
                }
            });
            done();
        });
    });

    facultyQueue.push({faculty: 'ads'});
    // facultyQueue.push({faculty: 'bus'});
    // facultyQueue.push({faculty:'comm'});
    // facultyQueue.push({faculty:'cii'});
    // facultyQueue.push({faculty:'dab'});
    // facultyQueue.push({faculty:'edu'});
    // facultyQueue.push({faculty:'eng'});
    // facultyQueue.push({faculty:'health'});
    // facultyQueue.push({faculty:'health-gem'});
    // facultyQueue.push({faculty:'it'});
    // facultyQueue.push({faculty:'intl'});
    // facultyQueue.push({faculty:'law'});
    // facultyQueue.push({faculty:'sci'});
    // facultyQueue.push({faculty:'tdi'});

    res.send('Check your console!');

    function getFacultySubjectNumbers(data) {
        var subjectNumList = [];
        var aList = data.find('a');
        for (var i = 0; i < aList.length; i++) {
            var val = aList.eq(i).text().trim();
            if (isNumeric(val)) {
                subjectNumList.push(val);
            }
        }
        return subjectNumList;
    }

    function isNumeric(val) {
        return !isNaN(parseFloat(val)) && isFinite(val);
    }
});

app.listen('8081');
console.log('Magic happens on port 8081');
exports = module.exports = app;





