require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const app = express();
const multer = require('multer');
const cors = require('cors');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})


// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(multer({ storage: storage }).single('images'));

const url = process.env.NODE_ENV === 'development' ? 'http://localhost:3020' : '';

console.log('NODE_ENV: ', process.env.NODE_ENV);
if(process.env.NODE_ENV === 'development') {
    app.use(cors());
    console.log('CORS enabled for development')
}

if(fs.existsSync('./public/posts') === false){
    fs.mkdirSync('./public/posts');
}
if(fs.existsSync('./public/projects') === false){
    fs.mkdirSync('./public/projects');
}


// Handle requests to the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/postList', (req, res) => {
    const result = [];
    fs.readdirSync('./public/posts').forEach(file => {
        const post = {
            id: file.split('.')[0],
            content: fs.readFileSync(`./public/posts/${file}`, 'utf8')
        }
        result.push(post);
    });
    res.send({result});
});
app.get('/post/:id', (req, res) => {
    const { id } = req.params;
    const postString = fs.readFileSync(`./public/posts/${id}.md`, 'utf8');
    res.send({id: id, content: postString});
});
app.post('/post', (req, res) => {
    const { id, content } = req.body;
    fs.writeFileSync(`./public/posts/${id}.md`, content);
    res.send({id: id, content: content});
});
app.put('/post/:id', (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    fs.writeFileSync(`./public/posts/${id}.md`, content);
    res.send({id: id, content: content});
});
app.delete('/post/:id', (req, res) => {
    const { id } = req.params;
    fs.rmSync(`./public/posts/${id}.md`);
    res.send({id: id});
});

app.get('/projectList', (req, res) => {
    const result = [];
    fs.readdirSync('./public/projects').forEach(folder => {
        const project = {
            id: folder.split('.')[0],
            description: fs.readFileSync(`./public/projects/${folder}/description.md`, 'utf8'),
            images: `${url}/projects/${folder}/logo.png`
        }
        result.push(project);
    });
    res.send({result});
});

app.get('/projects/:id', (req, res) => {
    const { id } = req.params;
    const project = {
        id: id,
        description: fs.readFileSync(`./public/projects/${id}/description.md`, 'utf8'),
        images: `${url}/projects/${id}/logo.png`
    }  
    res.send({project});
});

app.post('/projects', (req, res) => {
    const { id, description } = req.body;
    const images = req.file;
    if(id && description){
        fs.mkdirSync(`./public/projects/${id}`);
        fs.writeFileSync(`./public/projects/${id}/description.md`, description);
        if(images){
            fs.copyFileSync(`./${images.path}`,`./public/projects/${id}/logo.png`);
            fs.rmSync(`./${images.path}`);
        }
        res.send({id: id, description: description, images: `${url}/projects/${id}/logo.png`});
    }else{
        res.status(400).send({error: 'id is required'});
    }
});

app.post('/projects/:id/image', (req, res) => {
    const { id } = req.params;
    const images = req.file;
    if(id && images){
        
        fs.copyFileSync(`./${images.path}`,`./public/projects/${id}/logo.png`);
        res.send({uploaded: true});
        fs.rmSync(`./${images.path}`);
    }else{
        res.status(400).send({error: 'id is required'});
    }
});

app.put('/projects/:id', (req, res) => {
    const { id } = req.params;
    const { description } = req.body;
    const images = req.file;
    if(id && description){
        if(fs.existsSync(`./public/projects/${id}`)){
            fs.writeFileSync(`./public/projects/${id}/description.md`, description);
            if(images){
                fs.copyFileSync(`./${images.path}`,`./public/projects/${id}/logo.png`);
                fs.rmSync(`./${images.path}`);
            }
            res.send({id: id, description: description, images: `${url}/projects/${id}/logo.png`}); 
        }else{
            res.status(400).send({error: 'id does not exist'});
        }
    }else{
        res.status(400).send({error: 'id is required'});
    }});

app.delete('/projects/:id', (req, res) => {
    const { id } = req.params;
    fs.rmSync(`./public/projects/${id}`, { recursive: true });
    res.send({id: id});
});




// Start the server
const port = process.env.PORT || 3020;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
