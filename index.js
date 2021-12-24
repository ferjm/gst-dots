const chokidar = require('chokidar');
const connectLivereload = require("connect-livereload");
const express = require('express');
const fs = require('fs');
const livereload = require("livereload");
const path = require('path');
const { spawn } = require("child_process");

const app = express();

app.use(connectLivereload());

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, "public")));

let dots = [];
app.get('', (req, res) => {
    res.render('index', {
        dots,
    });
});

const dotDir = process.env.GST_DEBUG_DUMP_DOT_DIR;
const svgDir = './public/svg/';

if (fs.existsSync(svgDir)) {
    fs.rmdirSync(svgDir, { recursive: true });
}
fs.mkdirSync(svgDir);
chokidar.watch((dotDir ? dotDir : '.') + '/*dot').on('all', async (event, dotFile) => {
    const out = svgDir + path.basename(dotFile).replace('.dot', '.svg');

    if (event == 'add') {
        spawn('dot', ['-Tsvg', dotFile, '-o', out]);
    } else if (event == 'unlink' && fs.existsSync(out)) {
        fs.rmSync(out);
    }
});

chokidar.watch('public/svg/*svg').on('all', async (event, path) => {
    const svg = path.replace('public/', '');
    const index = dots.indexOf(svg);
    if (event == 'add' && index < 0) {
        dots.push(svg);
    } else if (event == 'unlink' && index >= 0) {
        dots.splice(index, 1);
    }
    liveReloadServer.refresh("/");
});

app.listen(3000, () => {
    console.log('Browse to http://localhost:3000');
});

const liveReloadServer = livereload.createServer({debug: false});
liveReloadServer.watch(path.join(__dirname, 'public', 'svg'));