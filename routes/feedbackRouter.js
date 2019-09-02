const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');
const feedbackRouter = express.Router();
feedbackRouter.use(bodyParser.json());
const nodemailer = require('nodemailer');


const Feedback = require('../models/feedback');

feedbackRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, authenticate.verifyAdmin, (req,res,next) => {
    Feedback.find(req.query)
    .then((feedbacks) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(feedbacks);
    }, (err) => next(err))
    .catch((err) => next(err));
})

.post(cors.corsWithOptions,
    (req, res, next) => {
        Feedback.create(req.body)
       .then((Feedback) => {
           console.log('Feedback created: ', Feedback);
           let transporter = nodemailer.createTransport({
               host: 'smtp.gmail.com',
               port: 465,
               secure: true,
               auth: {
                   user: 'adham.prince1@gmail.com',
                   pass: '**********'
               }
           });
           let mailOptions = {
               from: Feedback.email, // sender address
               to: 'hamzahajyousef@gmail.com, adham.prince1@gmail.com', // list of receivers
               subject: Feedback.email , // Subject line
               text: "Merhaba ben " + Feedback.firstname + " " + Feedback.lastname, // plain text body
               html: "Merhaba ben " + Feedback.firstname + " " + Feedback.lastname + '<br>' + '<b>'+ Feedback.message +'</b>' + '<br>' + " Beni ulaş " + Feedback.email + '<br>' + Feedback.telnum // html body
           };
     
           transporter.sendMail(mailOptions, (error, info) => {
               if (error) {
                   return console.log(error);
               }
               console.log('Message %s sent: %s', info.messageId, info.response);
               res.statusCode = 200;
               res.setHeader('Content-Type', 'application/json');
               res.json(Feedback);
               });

       }, (err) => next(err))
       .catch((err) => next(err));
})

.put(cors.corsWithOptions, authenticate.verifyUser,authenticate.verifyAdmin, (req,res,next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /feedbacks');
})

.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req,res,next) => {
    Feedback.remove({})
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));
});



feedbackRouter.route('/:feedbackId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, authenticate.verifyAdmin, (req,res,next) => {
    Feedback.findById(req.params.feedbackId)
    .then((feedback) => {
        if(feedback != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(feedback);
        }
        else {
            err = new Error('feedback ' + req.params.feedbackId + ' not found ');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})

.post(cors.corsWithOptions, authenticate.verifyUser,authenticate.verifyAdmin, (req,res,next) => {
    res.statusCode = 403;
    res.end('POST operation not supported on /feedbacks/' + req.params.feedbackId);
})

.put(cors.corsWithOptions, authenticate.verifyUser,authenticate.verifyAdmin, (req,res,next) => {
    res.statusCode = 403;
    res.end('Put operation not supported on /feedbacks/' + req.params.feedbackId);
})

.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req,res,next) => {
    Feedback.findByIdAndRemove(req.params.feedbackId)
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));
});

module.exports = feedbackRouter;

