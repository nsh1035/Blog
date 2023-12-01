const mongoClient = require('mongodb').MongoClient;
const ObjId = require('mongodb').ObjectId;
const url = 'mongodb+srv://nsh1035:ae200100@cluster0.otf4cww.mongodb.net/?retryWrites=true&w=majority';
let mydb;
mongoClient
    .connect(url)
    .then((client) => {
        mydb = client.db("myboard");

        app.listen(8080, function(){
            console.log("포트 8080으로 서버 대기중 ...");
        });
    })
    .catch((err) => {
        console.log(err);
});

var mysql = require("mysql2");
var conn = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "1234",
    database: "myboard",
});

conn.connect();

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const { ObjectId } = require('mongodb');
app.use(bodyParser.urlencoded({extended:true}));

app.set('view engine', 'ejs');
app.use(express.static("public"));

//이미지 경로 설정
let multer = require('multer');
let storage = multer.diskStorage({
    destination : function(req, file, done){
        done(null, './public/image')
    },
    filename : function(req, file, done){
        done(null, file.originalname)
    }
})

//세션 설정
let session = require('express-session');
app.use(session({
    secret : 'dkufe8938493j4e08349u',
    resave : false,
    saveUninitialized : true
}))

app.get("/session", function(req, res){
    if(isNaN(req.session.milk)){
        req.session.milk = 0;
    }
    req.session.milk = req.session.milk + 1000;
    res.send("session : " + req.session.milk + "원");
});

//로그인 처리
app.get('/login', function(req, res){
    console.log(req.session);
    if(req.session.user){
        console.log('세션 유지');
        res.render('index.ejs', {user : req.session.user});
    }else{
        res.render('login.ejs');
    }
});

app.post('/login', function(req, res){
    console.log("ID: " + req.body.userid);
    console.log("PW: " + req.body.userpw);

    mydb.collection("account")
        .findOne({userid : req.body.userid})
        .then((result) => {
            if(result.userpw == req.body.userpw){
                req.session.user = req.body;
                console.log('새로운 로그인');
                res.render('index.ejs', {user : req.session.user});
            }else{
                res.render('login.ejs');
            }
        });
});

//로그아웃
app.get('/logout', function(req, res){
    console.log('로그아웃');
    req.session.destroy();
    res.render('index.ejs', {user : null});
});

//회원가입
app.get('/signup', function(req, res){
    res.render('signup.ejs');
});

app.post('/signup', function(req, res){
    console.log(req.body.userid);
    console.log(req.body.userpw);
    console.log(req.body.usergroup);
    console.log(req.body.useremail);

    mydb.collection('account').insertOne(
        {userid : req.body.userid, userpw : req.body.userpw, usergroup : req.body.usergroup, useremail : req.body.useremail,}
    ).then(result => {
        console.log('회원가입 성공');
    });
    res.redirect("/");
});

//친구 관리
app.get('/friend', function(req, res){
    res.render('friend.ejs');
});

app.post('/friend', function(req, res){
    console.log(req.body.friend1);
    console.log(req.body.friend2);
    console.log(req.body.friend3);
    let id = req.session.user.userid;

    mydb.collection('account').updateOne({userid : id}, 
        {$set: {friend1: req.body.friend1, friend2: req.body.friend2, friend3: req.body.friend3}}
    ).then(result => {
        console.log('데이터 수정 완료');
        res.redirect('/');
    });
});

app.get('/', function(req, res){
    if (req.session.user) {
        res.render('index.ejs', { user: req.session.user });
    } else {
        res.render('index.ejs', {user : null});
    }
});

app.get('/entermongo', function(req, res){
    res.render('enter.ejs');
});

app.get('/listmongo', function(req, res) {
    mydb.collection("post").find().toArray().then(result => {
        console.log(result);
        res.render("listmongo.ejs", {data : result});
    })
});

// '/content'에 대한 처리
app.get('/content/:id', function(req, res) {
    console.log(req.params.id);
    let new_id = new ObjId(req.params.id);
    mydb.collection("post").findOne({ _id : new_id})
    .then(result => {
        console.log(result);
        res.render("content.ejs", {data : result});
    }).catch(err => {
        console.log(err);
        res.status(500).send();
    });
});

// '/edit'에 대한 처리
app.get('/edit/:id', function(req, res) {
    console.log(req.params.id);
    let new_id = new ObjId(req.params.id);
    mydb.collection("post").findOne({ _id : new_id})
    .then(result => {
        console.log(result);
        res.render("edit.ejs", {data : result});
    }).catch(err => {
        console.log(err);
        res.status(500).send();
    });
});

app.post('/savemongo', function(req, res){
    console.log(req.body.title);
    console.log(req.body.content);
    console.log(req.body.someDate);
    console.log(req.session.user);
    let now = new Date();
    let id = req.session.user.userid;

    mydb.collection('post').insertOne(
        {title : req.body.title, content : req.body.content, date : now.toISOString(), path : imagepath, writer : id}
    ).then(result => {
        console.log(result);
        console.log('데이터 추가 성공');
    });
    res.send('데이터 추가 성공');
});

app.post('/delete', function(req, res){
    console.log(req.body);
    req.body._id = new ObjId(req.body._id);

    mydb.collection('post').deleteOne(req.body)
    .then(result => {
        console.log('삭제 완료');
        res.status(200).send();
    })
    .catch(err => {
        console.log(err);
        res.status(500).send();
    });
});

//수정 처리
app.post('/edit', function(req, res){
    console.log(req.body.title);
    console.log(req.body.content);
    let new_id = new ObjId(req.body.id);

    mydb.collection('post').updateOne({_id : new_id}, 
        {$set: {title : req.body.title, content : req.body.content}}
    ).then(result => {
        console.log('데이터 수정 완료');
        res.redirect('/listmongo');
    });
});

//'/photo' 요청 처리
let upload = multer({storage : storage});
let imagepath = '';
app.post('/photo', upload.single('picture'), function(req, res){
    console.log(req.file.path);
    imagepath = '/' + req.file.path.replace(/\\/g, '/').slice('/public'.length);
    console.log(imagepath);
});

//검색
app.get('/search', function(req, res){
    console.log(req.query.value);

    mydb.collection('post').find({title:req.query.value}).toArray()
    .then(result => {
        console.log(result);
        res.render("sresult.ejs", { data : result});
    });
});

app.get('/main', function(req, res) {
    mydb.collection("post").find().toArray().then(result => {
        console.log(result);
        res.render("main.ejs", {data : result});
    })
});

app.get('/listfriend', function(req, res) {
    let id = req.session.user.userid;

    // 두 개의 데이터를 가져오는 비동기 작업을 Promise.all을 사용하여 동시에 처리
    Promise.all([
        mydb.collection("post").find().toArray(),
        mydb.collection("account").findOne({ userid: id })
    ]).then(results => {
        const [postData, userData] = results;
        
        console.log(postData);
        console.log(userData);
        
        res.render("listfriend.ejs", { user: userData, data: postData });
    });
});