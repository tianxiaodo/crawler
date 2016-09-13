/**
 * Created by alan on 16/9/12.
 */
var http = require("http"),
    url = require("url"),
    superagent = require("superagent"),
    ct = require('superagent-charset'),
    cheerio = require("cheerio"),
    fs=require("fs");
    async = require("async"),
    eventproxy = require('eventproxy');
var ep = new eventproxy(),
    urlsArray = [],	//存放爬取网址
    pageUrls = [];	//存放收集文章页面网站

    // 兼容非utf8 编码的页面，需手动设置页面编码格式。
    ct(superagent);

var data=[];


    urlsArray=[
        "http://jtjy.xdf.cn/list_8406_1.html",
        "http://jtjy.xdf.cn/list_1334_1.html",
        "http://jtjy.xdf.cn/list_8408_1.html",
        "http://jtjy.xdf.cn/list_1336_1.html",
        "http://jtjy.xdf.cn/list_8398_1.html",
        "http://jtjy.xdf.cn/list_1339_1.html",
        "http://jtjy.xdf.cn/list_8400_1.html",
        "http://jtjy.xdf.cn/list_1332_1.html",
        "http://jtjy.xdf.cn/list_1333_1.html",
        "http://jtjy.xdf.cn/list_8404_1.html",
        "http://jtjy.xdf.cn/list_1338_1.html"
    ];

// 开始
function start(){
    // 所有事件结束后处罚
    ep.after("endOne",urlsArray.length,function(){
        //console.log(pageUrls);
        pageUrls.forEach(function(url){
            var date=new Date();
            // 将爬取的文章地址存储到本地文件
            var fileName="./newsUrl"+date.toLocaleString()+".txt";
            fs.appendFile(fileName,url+"\r",'utf8',function(err){
                if(err)
                {
                    console.log(err);
                }
            });
        });

        // 获取文章页面内容
        getContent();
    });

    urlsArray.forEach(function(pageUrl){
        superagent.get(pageUrl)
            .end(function(err,pres){

                // 载入页面，方便操作dom
                var $ = cheerio.load(pres.text);
                var a=$(".mainL .txt_lists01 li").children("a")
                    .each(function(i,ele){
                        pageUrls.push($(ele).attr("href"));
                    });

                // 单次请求结束
                ep.emit("endOne",pageUrls);
            });
    });
}

// 获取并分析页面结构
function getAnalyseHtml(url, callback){
    if(url){
        superagent.get(url)
            .set("Content-Type","text/html; charset=utf8")
            .end(function(err,pres){
                var $ = cheerio.load(pres.text);

                if($(".main_article")&&$(".main_article").length>0){
                    var content=$(".main_article").get(0).outerHTML;
                    //content=content.replace(/class="/)
                    var obj={
                        title:$(".lf_Container h1").html(),
                        //content:content,
                        origin:""
                    };
                    data.push(obj.title);
                }
                else{
                    // 输出规则不适用的url
                    console.log("---------------------------获取内容规则不适用:"+url);
                }
            });
    }

    // 结束时执行一次
    callback("",data);
}

// 开始获取页面内容
function getContent(){

    // 限制并发数量
    async.mapLimit(pageUrls, 5, function (url, callback)
    {
        getAnalyseHtml(url, callback);
    }
        // 并发结束后的回调
    , function (err, result) {

        console.log('final:');
        //console.log(data);
    });
    //console.log(pageUrls[0]);
}

start();
