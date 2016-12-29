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


app.get('/scrape', function (req, res) {
    // Let's scrape UTS subjects from each faculty.

    const rootUrl = 'http://www.handbook.uts.edu.au/';
    const subjectsListUrl = '/lists/alpha';
    const subjectUrl = 'subjects/';
    const subjectDetailsUrl = 'details/';
    var json = {utsSubjects : {}};
    //var utsSubjects = {};
    var index = 0;

    var q = async.queue(function (task, done) {

        request(rootUrl + task.faculty + subjectsListUrl, function (error, response, html) {
            if (error) return done(error);
            if (response.statusCode != 200) return done(response.statusCode);

            var $ = cheerio.load(html);

            var subjectQueue = async.queue(function (task, done) {
                request(rootUrl + subjectUrl + task.number, function (error, response, html) {
                    if (error) return done(error);
                    if (response.statusCode != 200) return done(response.statusCode);
                    index++;
                    var $ = cheerio.load(html);

                    $('.ie-images').filter(function () {
                        var data2 = $(this);
                        var name = data2.children().eq(0).text().replace(/^[0-9]*/, '').trim();
                        var number = task.number;
                        var credits = data2.children().eq(1).text().trim();
                        var h3List = data2.find('h3');
                        var description = "";
                        for ( var i = 0; i < h3List.length; i++ ) {
                            if (h3List.eq(i).text() === "Description")  {
                                description = h3List.eq(i).next().next().text().trim();
                            }
                        }
                        var handbookLink = rootUrl + subjectUrl + subjectDetailsUrl + task.number;

                        var subjectId = "sub" + index;
                        json.utsSubjects[subjectId] = {"name" : name, "number": number, "credits": credits, "description": description, "handbookLink" : handbookLink};

                        fs.writeFile('output.json', JSON.stringify(json, null, 4), function (err) {
                            console.log('File successfully written! - Check your project directory for the output.json file');
                        });

                    });
                    done();

                });
            });

            $('.ie-images').filter(function () {
                var data = $(this);
                var subjectNumList = getFacultySubjectNumbers(data);
                for (var j = 0; j < subjectNumList.length; j++) {
                    console.log(subjectNumList[j]);
                    subjectQueue.push({ number: subjectNumList[j] });
                }
            });

            // fs.writeFile('output.json', JSON.stringify(json, null, 4), function (err) {
            //     console.log('File successfully written! - Check your project directory for the output.json file');
            // });

            done();

        });
    });

    q.push({ faculty: 'ads' });
    q.push({faculty:'bus'});
    // q.push({faculty:'comm'});
    // q.push({faculty:'cii'});
    // q.push({faculty:'dab'});
    // q.push({faculty:'edu'});
    // q.push({faculty:'eng'});
    // q.push({faculty:'health'});
    // q.push({faculty:'health-gem'});
    // q.push({faculty:'it'});
    // q.push({faculty:'intl'});
    // q.push({faculty:'law'});
    // q.push({faculty:'sci'});
    // q.push({faculty:'tdi'});

    res.send('Check your console!');



    function getFacultySubjectNumbers(data) {

        //var data = getPageData($);
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

    function getPageData($) {
        $('.ie-images').filter(function () {
            return $(this);
        });
    }

    function isNumeric(val) {
        return !isNaN(parseFloat(val)) && isFinite(val);
    }

    function getSubjectData(number) {

        //TODO: This isn't getting the correct information if content is missing from the dom. Need to redo this - Find something that is like 'after().find('description').getNext()'

        var data = getPageData();
        var name = data.children().eq(0).text().trim();
        var credits = data.children().eq(1).text().trim();
        var type = data.children().eq(7).text().trim();
        var description = data.children().eq(10).text().trim();
        var handbookLink = rootUrl + subjectUrl + subjectDetailsUrl + number;
    }

});

app.listen('8081')
console.log('Magic happens on port 8081');
exports = module.exports = app;





