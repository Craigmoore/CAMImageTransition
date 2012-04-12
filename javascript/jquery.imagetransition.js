(function( $ ) {
		
	var transferAlpha = function (alpha, destination) {
		for (var yC = 0; yC < alpha.height; yC ++) {
			for (var xC = 0; xC < alpha.width; xC ++) {
				destination.data[((yC*(alpha.width*4)) + (xC*4)) + 3] = alpha.data[((yC*(alpha.width*4)) + (xC*4)) + 0];
			}
		}
	};
	
	$.widget( "ui.imagetransition", {
		options: {

			width : 100,
			height : 75,
			frames : 5,
		
			imageURLs : ['images/first.png', 'images/second.png', 'images/third.png', 'images/fourth.png'],
			images : [],
			
			transitionURLs : ['images/heart_transition.png', 'images/gradient_transition.png', 'images/noise_transition.png', 'images/reflected_gradient_transition.png'],
			transitions : [],
			
			generatedTransitions : [],
			generatedTransitionFrames : [],
	
			foregroundTransition : 0,
			backgroundTransition : 1
		},
		_create: function() {
	
			var context = this;
			
			this.element.css({
				position : 'relative',
				width : this.options.width,
				height : this.options.height,
				overflow : 'hidden'
			});
			
			var images = this.element.find('img');
			
			this.options.backgroundImg = images.first()
				.css({	'position' : 'absolute' })
				.attr({	'width' : this.options.width * this.options.frames,
						'height' : this.options.height});
						
			this.options.foregroundImg = images.slice(1)
				.css({	'position' : 'absolute',
						'display' : ''})
				.attr({	'width' : this.options.width * this.options.frames,
						'height' : this.options.height});
						
			this.options.junkDiv = $('<div />')
				.css({'display' : 'none'});
			
			this.element.empty();
								
			this.options.backgroundImg.appendTo(this.element);
			this.options.foregroundImg.appendTo(this.element);
			this.options.junkDiv.appendTo(this.element);
			this._loadImages();
		},
		_loadImages : function() {
			var context = this;
			
			this.options.junkDiv.empty();
			this.options.totalNumberOfImages = this.options.imageURLs.length + this.options.transitionURLs.length;
			this.options.currentNumberOfImagesLoaded = 0;
	
			var attachImage = function(imageURL) {
				var image = $('<img />');
				image.bind('load', function() {
					context._imageLoadCallback();
				});
				image.appendTo(context.options.junkDiv);
				image.attr({'src' : imageURL});
				return image;
			};
			
			for (var counter = 0; counter < this.options.imageURLs.length; counter ++) {
				this.options.images.push(attachImage(this.options.imageURLs[counter]));
			}
			for (var counter = 0; counter < this.options.transitionURLs.length; counter ++) {
				var imageReturn = attachImage(this.options.transitionURLs[counter]);
				this.options.transitions.push(imageReturn);
			}
		},
		_imageLoadCallback : function() {
			this.options.currentNumberOfImagesLoaded ++;
			
			if (this.options.currentNumberOfImagesLoaded == this.options.totalNumberOfImages) {
				this._generateTransitions();
				this._startAnimation();
			}
		},
		_generateTransitions : function() {
			this.options.generatedTransitions = [];
			this.options.generatedTransitionFrames = [];
			for (var counter = 0; counter < this.options.images.length; counter ++) 
				this._generateTransition(this.options.images[counter], this.options.transitions[counter]);
		},
		_generateTransition : function(image, transition) {
			var cw = this.options.width * this.options.frames,
				ch = this.options.height;
			
			var canvas = $('<canvas />')
				.attr({	width : cw,
							height : ch})
				.appendTo(this.options.junkDiv);
			var ctx = canvas[0].getContext('2d');
			
			var frames = transition.attr('width') / this.options.width;

			this.options.generatedTransitionFrames.push(frames);
			
			for (var fcounter = 0; fcounter < frames; fcounter ++) {
				ctx.drawImage(image[0], fcounter * this.options.width, 0);
			}
			
			var alphaCanvas = $('<canvas />')
				.attr({	width : cw,
						height : ch});		
			var alphaCTX = alphaCanvas[0].getContext('2d');
			alphaCTX.drawImage(transition[0], 0, 0);
			
			var cid = ctx.getImageData(0,0,cw, ch), acid = alphaCTX.getImageData(0,0,cw, ch);
			
			transferAlpha(acid, cid);
			ctx.putImageData(cid, 0, 0);
					
			var finalImage = $('<img />')
				.attr({'src' : canvas[0].toDataURL()});
			
			this.options.generatedTransitions.push(finalImage);
		},
		_startAnimation : function() {
			this.options.junkDiv.empty();
			this.options.foregroundTransitionIndex = 1;
			this.options.backgroundTransitionIndex = 0;
			
			this.options.foregroundTransitionPos = 0;
			this._setCurrentTransitionSrc();
			this._update();
		},
		_updateTransition : function() {
			this.options.foregroundTransitionPos -= this.options.width;
			if (this.options.foregroundTransitionPos < -this.options.width * (this.options.frames-1)) {
				this.options.foregroundTransitionPos = 0;
				this._nextTransition();
				this._setCurrentTransitionSrc();
			}
		},
		_setCurrentTransitionSrc : function() {
			this.options.backgroundImg
				.attr({
					'src' : this.options.generatedTransitions[this.options.backgroundTransitionIndex].attr('src')
				});
			this.options.foregroundImg
				.attr({
					'src' : this.options.generatedTransitions[this.options.foregroundTransitionIndex].attr('src')
				});
		},
		_setCurrentTransitionPosition : function() {
			this.options.backgroundImg
				.css({
					'margin-left' : - (this.options.frames - 1) * this.options.width
				});
			this.options.foregroundImg
				.css({
					'margin-left' : this.options.foregroundTransitionPos
				});
		},
		_nextTransition : function() {
		
			this.options.backgroundTransitionIndex = this.options.foregroundTransitionIndex;
		
			if (this.options.foregroundTransitionIndex + 1 == this.options.generatedTransitions.length) {
				this.options.foregroundTransitionIndex = 0;
			}
			else this.options.foregroundTransitionIndex ++;
		},
		_update : function() {
			var context = this;

			this._updateTransition();
			this._setCurrentTransitionPosition();
			
			window.setTimeout(function() {context._update();}, this.options.generatedTransitionFrames[this.options.foregroundTransitionIndex] * 1000  / 60);
		},
		destroy: function() {
			$.Widget.prototype.destroy.apply( this, arguments );
		},
		_setOption: function( key, value ) {
			var resolved = true;
			
			switch ( key ) {
				case 'imageURLs' :
					this.options.imageURLs = value;
					this._loadImages();
					break;
				case 'transitionURLs' :
					this.options.transitionURLs = value;
					this._loadImages();
					break;
				case 'data' :
					this.options.imageURLs = value.imageURLs;
					this.options.transitionURLs = value.transitionURLs;
					this._loadImages();
				default :
					resolved = false;
			}
			if (!resolved) $.Widget.prototype._setOption.apply( this, arguments );
		}
	});
	$.extend( $.ui.imagetransition, {
		version: "@VERSION"
	});

})( jQuery );