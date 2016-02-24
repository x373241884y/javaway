var fs = require('fs'),
    path = require('path'),
    http = require('http');
var MIME = {
    text: 'text/plain',
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    json:'application/json'
};
//sysconfig
var defaults = {
    root: ".",
    port: 8080
};

function formatDate(date, style){
    var y = date.getFullYear();
    var M = "0" + (date.getMonth() + 1);
    M = M.substring(M.length - 2);
    var d = "0" + date.getDate();
    d = d.substring(d.length - 2);
    var h = "0" + date.getHours();
    h = h.substring(h.length - 2);
    var m = "0" + date.getMinutes();
    m = m.substring(m.length - 2);
    var s = "0" + date.getSeconds();
    s = s.substring(s.length - 2);
    return style.replace('yyyy', y).replace('MM', M).replace('dd', d).replace('HH', h).replace('mm', m).replace('ss', s);
}
function main(argv) {
    if (argv && argv.length != 0) {  //user config
        var argstr = argv.join(" ");
        argstr = " " + argstr + " ";
        if (/\s-h\s/.test(argstr)) {
            console.log("use case:");
            console.log("         node server.js -p8080");
            return;
        }
        if (/\s-p\s?\d{1,5}\s/.test(argstr)) {
            defaults.port = argstr.replace(/\s+-p(\d+)/, "$1");
        }
    }

    root = defaults.root, port = defaults.port;
    var server = http.createServer(function (request, response) {
        console.log(formatDate(new Date(),"yyyy-MM-dd HH:mm:ss")+" "+request.method + ":" + request.url);
        var urlInfo = parseURL(root, request);
        validateFiles(urlInfo.pathname, function (err, filename) {
            if (err) {
                response.writeHead(404);
                response.write("404! sorry," + filename + " not found!");
                response.end(err.message);
                console.log(err.message);
            } else {
                response.writeHead(200, {
                    'Content-Type': urlInfo.mime
                });
                outputFiles(filename, response);
            }
        });
    }).listen(port);
    //process.on('SIGTERM', function () {
    //    server.close(function () {
    //        process.exit(0);
    //    });
    //});
    console.log("start server in http://127.0.0.1:" + port);
}

function parseURL(root, request) { //   /foo/??bar.js,baz.js
    url=request.url.replace(/(\?.*)/,"");
    if (/\/$/.test(url)) { //   "/   ,  /dfafdaf/fdf/"
        url += "index.html";
    }
    var parseObj = {
        mime: MIME.text,
        pathname: '/index.html'
    }
    if (/\w+\.html/.test(url)) {
        parseObj.mime = MIME.html;

    } else if (/\w+\.css$/.test(url)) {
        parseObj.mime = MIME.css;
    } else if (/\w+\.js$/.test(url)) {
        parseObj.mime = MIME.js;
    } else if (/\w+\.json$/.test(url)) {
        parseObj.mime = MIME.json;
    }else if(/\w+\.do$/.test(url)){
        var do_str = url.replace(/(\w+)\.do/, "$1");
        //htmls/PersonInfoChange/PersonInfoChange.html ,htmls/Menu/Menu.html
        var referer=request.headers.$referer;
        if(referer) {
            var base = referer.replace(/(htmls)(\/.*\/)\w+\.html/, "/data$2");
            url=base+do_str+".json";
        }else{
            url="/data"+do_str+".json";
        }
    }
    parseObj.pathname = path.join(defaults.root, url);
    return parseObj;
}

function outputFiles(filename, response) {
    var reader = fs.createReadStream(filename);
    reader.pipe(response, {end: true});
}
function validateFiles(pathname, callback) {
    fs.stat(pathname, function (err, stats) {
        if (err) {
            callback(err);
        } else if (!stats.isFile()) {
            callback(new Error());
        } else {
            callback(null, pathname);
        }
    });
}
main(process.argv.slice(2));
