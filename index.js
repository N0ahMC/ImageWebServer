const express = require('express')
const app = express()
const fs = require('fs')

app.set('view engine', 'ejs')

app.use('/assets', express.static('assets'))
app.use('/image', express.static('images'))
const types = ['', '.png', '.jpg', '.jpeg']
let Rpath = ''
let Rtype = ''
app.get('/:image', (req, res) => {
    types.forEach(i => {
        if (fs.existsSync(`images/${req.path.slice(1)}${i}`)) {
            Rpath = req.path.slice(1)
            Rtype = i
        }
    });
    if (fs.existsSync(`images/${req.path.slice(1)}`) || fs.existsSync(`images/${req.path.slice(1)}.png`) || fs.existsSync(`images/${req.path.slice(1)}.jpg`) || fs.existsSync(`images/${req.path.slice(1)}.jpeg`)) {
        res.render('pages/image', {
            path: Rpath,
            type: Rtype
        })
    } else {
        res.render('pages/404', {
            path: req.path.slice(1)
        })
    }
})
app.get('/', (req, res) => {
    res.render('pages/index', {
        path: req.path.slice(1)
    })
})

app.listen(5656, () => {
    console.log('http://localhost:5656')
})