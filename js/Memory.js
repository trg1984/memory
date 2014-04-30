Memory = function(place, config) {
    this.place = place;
    this.config = {
		gfxPath: 'gfx/',
		sfxPath: 'sfx/',
		tilesX: 10,
		tilesY: 10,
		waitTime: 750,
		board: {
			width: 3,
			height: 3
		},
		tileCount: 40,
		gfxFiles: {
			closedTile: 'closed.png',
			tileImages: 'pics.png'
		},
		sfxFiles: {
			flipSound: 'flip.wav',
			foundSound: 'found.wav'
		}
    };
    
    // Initialize containers for graphics and sound.
    this.gfx = {};
    this.sfx = {};
    
    // Merge configs.
    for (var item in config) this.config[item] = config[item];
    
    this.place.addClass('memory');
}

/**
 * Asynchronic initialization part:
 * -Load graphics.
 * -Load sound effects.
 */

Memory.prototype.loadSounds = function(callback) {
    // TODO support for multiple audio formats simultaneously.
    
    // Count loaded items.
    var pendingItems = 0;
    for (item in this.config.sfxFiles) ++pendingItems;
    
    var __loadDone = function(e) {
		--pendingItems;
		if (pendingItems === 0) callback.call(window);
    }
    
    // Load all sounds.
    for (item in this.config.sfxFiles) {
		var snd = document.createElement("audio");
		snd.onload = __loadDone;
		this.sfx[item] = snd;
		snd.src = this.config.sfxPath + this.config.sfxFiles[item];
    }
}

Memory.prototype.loadGraphics = function(callback) {
    
    // Count loaded items.
    var pendingItems = 0;
    for (item in this.config.gfxFiles) ++pendingItems;
    
    var __loadDone = function(e) {
		--pendingItems;
		if (pendingItems === 0) callback.call(window);
    }
    
    // Load all graphics.
    for (item in this.config.gfxFiles) {
		var img = new Image();
		img.onload = __loadDone;
		this.gfx[item] = img;
		img.src = this.config.gfxPath + this.config.gfxFiles[item];
    }
}

Memory.prototype.tileClickHandler = function(e) {
    var self = this;
    
    var flipped = this.place.find('.cell .back.flipped');
    
    if (flipped.length < 2) {
	
	var cell = $(e.currentTarget);
	if (!cell.find('.back').hasClass('found')) {
	    cell.find('.front, .back').addClass('flipped');
	    
	    // Update flipped to check if a flip was made.
	    flipped = this.place.find('.cell .back.flipped');
	}
    }
    
    if (flipped.length === 2) {
		
		var n1 = flipped.eq(0).attr('data-n') | 0;
		var n2 = flipped.eq(1).attr('data-n') | 0;
		
		if (n1 === n2) {
			this.sfx['foundSound'].play();
			
			// TODO handle the pair.
			setTimeout(
			function() { 
				self.place.find('.flipped').addClass('found').removeClass('flipped');
				
				var found = self.place.find('.cell .front.found');
				var maxItems = Math.min( Math.floor(self.config.board.width * self.config.board.height / 2) * 2, self.config.tileCount * 2 );
		
				if (found.length === maxItems) {
				self.createBoard();
				}
			},
			self.config.waitTime
			);
		}
		else {
			this.sfx['flipSound'].play();
			setTimeout(
			function() {
				self.sfx['flipSound'].play();
				self.place.find('.flipped').removeClass('flipped');
			},
			self.config.waitTime
			);
		}
    } else this.sfx['flipSound'].play();
}

Memory.prototype.createBoard = function() {
    var self = this;
    
    // There must be an even number of items that doesn't exceed the maximum.
    var maxItems = Math.min( Math.floor(this.config.board.width * this.config.board.height / 2) * 2, this.config.tileCount * 2 );
    
    var deck = [];
    for (var i = 0; i < maxItems / 2; ++i) {
	// Push a pair into the deck.
	deck.push(i);
	deck.push(i);
    }
    
    // Clear the board and build a new one.
    this.place.empty();
    
    var counter = 0;
    for (var y = 0; y < this.config.board.height; ++y) {
	this.place.append('<div class="row" data-row="' + y + '"></div><br />');
	var rowItem = this.place.find('[data-row="' + y + '"]');
	
	for (var x = 0; x < this.config.board.width; ++x) {
	    var n = deck.splice(Math.floor(Math.random() * deck.length), 1)[0];
	    rowItem.append(
		'<div class="column" data-col="' + x + '">' +
		    '<div class="cell" data-cellid="' + (y * this.config.board.height + x) + '">' +
			 // At most maxItems items are allowed.
			(counter < maxItems ?
			    '<div class="front animated"></div>' +
			    '<div class="back animated" data-n="' + n + '"></div>'
			: '' ) +
		    '</div>' +
		'</div>');
	    if (counter < maxItems) rowItem.find('.cell[data-cellid="' + (y * this.config.board.height + x) + '"] .back').append(this.tiles[n].cloneNode(true));
	    ++counter;
	}
    }
    this.place.find('.cell .front')
	.append(this.gfx['closedTile']);
	
    this.place.find('.cell').on('click', function(e) { self.tileClickHandler(e) } )
    
    var temp = new Array(this.config.board.width * this.config.board.height);
    
}

Memory.prototype.chopPieces = function(callback) {
    
    this.tiles = [];
    this.pieceWidth = this.gfx['tileImages'].width / this.config.tilesX;
    this.pieceHeight = this.gfx['tileImages'].height / this.config.tilesY;
    
    var canvas = document.createElement("canvas");
    canvas.width = this.pieceWidth;
    canvas.height = this.pieceHeight;
    var ctx = canvas.getContext("2d");
    
    var counter = 0;
    for (var y = 0; y < this.config.tilesY; ++y)
    for (var x = 0; x < this.config.tilesX; ++x) {
	
	ctx.drawImage(this.gfx['tileImages'], -x * this.pieceWidth, -y * this.pieceHeight);
	
	var tile = new Image();
	tile.id = "tile" + counter;
	tile.src = canvas.toDataURL();
	this.tiles.push(tile);
	
	++counter;
	if (counter >= this.config.tileCount) break;
    }
    
    callback.call(window);
}

Memory.prototype.initialize = function(callback) {
    
    var self = this;
    var pendingItems = 3;
    
    var __onDone = function() {
	--pendingItems;
	if (pendingItems === 0) callback.call(window);
    }
    
    
    this.loadSounds(__onDone);
    this.loadGraphics( function() { self.chopPieces( function() { self.createBoard(__onDone) } ) } );
}

Memory.prototype.start = function() {
    // TODO handle board restart here.
}
