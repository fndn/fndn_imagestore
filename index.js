
var DEBUG 		= 3;
var chalk 		= require('chalk');
var fs 			= require('fs-extra');
var util 		= require('util');
var path 		= require('path');
var multiparty  = require('multiparty');
var bytes 		= require('bytes');
var glob 		= require("glob");
var archiver 	= require('archiver');

var dir_uploads = '';

module.exports.init = function( app, conf, express ){

	var dir_uploads = conf.imagestore; //path.normalize( __dirname +'/../imagestore/');
	fs.mkdirsSync(dir_uploads);

	app.use('/pub/images', express.static(conf.imagestore));
	console.log( chalk.green('+ images ')+ 'public' +' on /pub/images');

	app.post('/api/images', function(req, res, next){
		new multiparty.Form().parse(req, function(err, fields, files) {
			if(DEBUG>1) console.log('processing file uploads', files, req.headers );

			var keys = Object.keys(files);
			if( keys.length === 0 ) return res.status(200).json({status:'ok', msg:'no files', files:r});

			var o = files[ keys[0] ][0]; // grab first, and only the first, file
			var d = path.normalize(dir_uploads +'/'+ o.originalFilename);

			fs.rename(o.path, d, function(err){
				if( err ) return res.status(500).json({status:'ok', msg:'upload error'});

				console.log( chalk.blue('Saved Original to'), d );
				res.status(200).json({status:'ok', msg:'upload_confirmed', name:o.originalFilename, size:bytes(o.size)});
			});
		});
	});
	console.log( chalk.green('+ images ')+ 'upload' +' on /api/images');


	app.get('/pub/zip/images', function(req, res){
		console.log('zip!');

		var archive = archiver('zip', {});

		archive.on('error', function(err) {
			res.status(500).send({error: err.message});
		});

		//on stream closed we can end the request
		archive.on('end', function() {
			console.log('Archive wrote %d bytes', archive.pointer());
		});

		res.attachment('images.zip');
		archive.pipe(res);
		//archive.directory( dir_uploads ); // should filter out entries starting with 'thumb-' 

		glob( dir_uploads+"/*.*", {}, function (er, files) {
  			files = files.filter(function(itm){ 
  				return path.basename(itm).substr(0,6)==='thumb-';
  			});
  			//console.log('files', files);

			for(var i in files) {
				archive.file(files[i], { name: path.basename(files[i]) });
			}
			archive.finalize();
  		});

		// or just all files in the folder:
		//archive.bulk([{ expand:true, cwd:dir_uploads, src:['*.*'] }]);

		
	});
	console.log( chalk.green('+ images ')+ 'download' +' on /pub/zip/images');
}

/*
var get_fn = function(req, res){
	var file = path.normalize( dir_uploads +'/'+ req.params.id );

	if(DEBUG>2) console.log('GET', route, req.params.id, " -> ", file );

	fs.stat(file, function(err, stats) {
		console.log("fs.stat cb:", err, stats);

		if( err === null && stats.isFile()) {
			console.log('file');
			
			res.sendFile(file, {dotfiles:'deny'}, function (err) {
				if(err){
					console.log("sendFile error:", err);
					//return res.status(500).send('');
				}
			});

		}else{
			
			if(DEBUG>2) console.log('404:', file );
			return res.status(404).send('');
		}
		
	});
};
*/