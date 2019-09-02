const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');

const Products = require('../models/product');
const productRouter = express.Router();
productRouter.use(bodyParser.json());
const fs = require('fs')

const multer = require('multer');


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images/products');
    },

    filename: (req, file, cb) => {
        cb(null, Math.random() + file.originalname)
    }
});

const imageFileFilter = (req, file, cb) => {
    if(!file.originalname.match(/\.(jpg|jpeg|png|gif|JPG|JPEG|PNG|GIF)$/)) {
        return cb(new Error('You can upload only image files!'), false);
    }
    cb(null, true);
};
const upload = multer({ storage: storage, fileFilter: imageFileFilter});


productRouter.route('/upload')
.options(cors.cors, (req, res) => { res.sendStatus(200); })
.get(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('GET operation not supported on /imageUpload');
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, upload.single('imageFile'), (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(req.file.filename);
});


productRouter.route('/')
.options(cors.corsWithOptions, (req, res) => {res.sendStatus(200); })
.get(cors.cors, (req, res, next) => {
    Products.find(req.query)
    .then((product) => {
        res.statusCode =200;
        res.setHeader('Content-Type', 'application/json');
        res.json(product);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Products.create(req.body)
    .then((product) => {
        console.log('product created', product);
        res.statusCode =200;
        res.setHeader('Content-Type', 'application/json');
        res.json(product);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('Put operation not supporter on /product');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Products.remove({})
    .then((resp) => {
        res.statusCode =200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));
});


productRouter.route('/:productId')
.options(cors.corsWithOptions, (req, res) => {res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Products.findById(req.params.productId)
    .then((product) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(product);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
  res.statusCode = 403;
  res.end('POST operation not supported on /product/'+ req.params.productId);
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Products.findByIdAndUpdate(req.params.productId, {
        $set: req.body
    }, { new: true})
    .then((product) => {
        console.log('product created', product);
        res.statusCode =200;
        res.setHeader('Content-Type', 'application/json');
        res.json(product);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Products.findByIdAndRemove(req.params.productId)
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));
});

productRouter.route('/:productId/images')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Products.findById(req.params.productId)
    .then((product) => {
        if (product != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(product.images);
        }
        else {
            err = new Error('product ' + req.params.productId + ' not found ');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})

.post(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    Products.findById(req.params.productId)
    .then((product) => {
        if (product != null) {
            req.body.author = req.user._id;
            product.images.push(req.body);
            product.save()
            .then((product) => {
                Products.findById(product._id)
                .then((product) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(product);
                })
            }, (err) => next(err));
        }
        else {
            err = new Error('product ' + req.params.productId + ' not found ');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})

.put(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /Products/' + req.params.productId + '/images');
})

.delete(cors.corsWithOptions, authenticate.verifyUser,authenticate.verifyAdmin, (req,res,next) => {
    Products.findById(req.params.productId)
    .then((product) => {
        if (product != null) {
            for (var i = (product.images.length -1); i >= 0; i--) {
                product.images.id(product.images[i]._id).remove();
            }
            product.save()
            .then((product) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(product);
            }, (err) => next(err));
        }
        else {
            err = new Error('product ' + req.params.productId + ' not found ');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});


productRouter.route('/:productId/images/:imageId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Products.findById(req.params.productId)
    .then((product) => {
        if (product != null && product.images.id(req.params.imageId) != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(product.images.id(req.params.imageId));
        }
        else if (product == null) {
            err = new Error('product ' + req.params.productId + ' not found ');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('Image ' + req.params.imageId + ' not found ');
            err.status = 404;
            return next(err);  
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})

.post(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    res.statusCode = 403;
    res.end('POST operation not supported on /Products/' + req.params.productId
        + '/images/' + req.params.imageId);
})

.put(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    Products.findById(req.params.productId)
    .then((product) => {
        if (product != null && product.images.id(req.params.imageId) != null) {
            if (req.body.image) {
                product.images.id(req.params.imageId).image = req.body.image;
            }
            product.save()
            .then((product) => {
                Products.findById(product._id)
                .then((product) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(product);
                })
            }, (err) => next(err));
        }
        else if (product == null) {
            err = new Error('product ' + req.params.productId + ' not found ');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('Image ' + req.params.imageId + ' not found ');
            err.status = 404;
            return next(err);  
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})

.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req,res,next) => {
    Products.findById(req.params.productId)
    .then((product) => {
        if (product != null && product.images.id(req.params.imageId) != null) {
            product.images.id(req.params.imageId).remove();
            product.save()
            .then((product) => {
                Products.findById(product._id)
                .then((product) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(product);
                })
            }, (err) => next(err));
        }
        else if (product == null) {
            err = new Error('product ' + req.params.productId + ' not found ');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('Image ' + req.params.imageId + ' not found ');
            err.status = 404;
            return next(err);  
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});

// productRouter.route('/:productId/images/:imageFile/delete')
// .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
// .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req,res,next) => {
//     Products.findById(req.params.productId)
//     .then((product) => {
//         if (product != null) {
//             var path = './public/' + imageFile;
//             console.log(path);
//             try {
//                 fs.unlinkSync(path)
//                 //file removed
//             } catch(err) {
//                 console.error(err)
//             }
//         }
//         else {
//             err = new Error('product ' + req.params.productId + ' not found ');
//             err.status = 404;
//             return next(err);
//         }
//     }, (err) => next(err))
//     .catch((err) => next(err));
// });


module.exports = productRouter;