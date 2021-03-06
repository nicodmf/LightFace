/*
---
description: Modal

license: MIT-style

authors:
- David Walsh (http://davidwalsh.name)
- Nicolas de Marqué

requires:
- core/1.2.1: '*'

provides: [Modal]

...
*/

var Modal = new Class({
	
	Implements: [Options,Events],
	
	options: {
		width: 'auto',
		height: 'auto',
		draggable: false,
		draggableButton: false,
		title: false,
		buttons: [],
		fadeDelay: 400,
		fadeDuration: 400,
		keys: { 
			esc: function() { this.close(); } 
		},
		content: '<p>Message not specified.</p>',
		zIndex: 9001,
		pad: 100,
		overlayAll: false,
		constrain: false,
		resetOnScroll: true,
		baseClass: 'modal',
		buttonsInTop: true,
		simpleBox:true,
		errorMessage: '<p>The requested file could not be found.</p>'/*,
		onOpen: $empty,
		onClose: $empty,
		onFade: $empty,
		onUnfade: $empty,
		onComplete: $empty,
		onRequest: $empty,
		onSuccess: $empty,
		onFailure: $empty
		*/
	},
	
	
	initialize: function(options) {
		this.setOptions(options);
		this.state = false;
		this.buttons = {};
		this.resizeOnOpen = true;
		this.ie6 = typeof document.body.style.maxHeight == "undefined";
		this.draw();
	},
	
	draw: function() {
		
		if(this.options.simpleBox){
			
			//create main box
			this.box = new Element('div',{
				'class': this.options.baseClass,
				styles: {
					'z-index': this.options.zIndex,
					opacity: 0
				},
				tween: {
					duration: this.options.fadeDuration,
					onComplete: function() {
						if(this.box.getStyle('opacity') == 0) {
							this.box.setStyles({ top: -9000, left: -9000 });
						}
					}.bind(this)
				}			
			}).inject(document.body,'bottom');

			this.contentBox = new Element('div',{
				'class': 'modalContent',
				styles: {
					width: this.options.width
				}
			}).inject(this.box);
			
			this.backgroundBox = new Element('div',{
				'class': 'modalBackground',
				styles: {
					width: this.options.width
				}
			}).inject(this.box, 'top');
			
		}else{
			
			//create main box
			this.box = new Element('table',{
				'class': this.options.baseClass,
				styles: {
					'z-index': this.options.zIndex,
					opacity: 0
				},
				tween: {
					duration: this.options.fadeDuration,
					onComplete: function() {
						if(this.box.getStyle('opacity') == 0) {
							this.box.setStyles({ top: -9000, left: -9000 });
						}
					}.bind(this)
				}
			}).inject(document.body,'bottom');

			//draw rows and cells;  use native JS to avoid IE7 and I6 offsetWidth and offsetHeight issues
			var verts = ['top','center','bottom'], hors = ['Left','Center','Right'], len = verts.length;
			for(var x = 0; x < len; x++) {
				var row = this.box.insertRow(x);
				for(var y = 0; y < len; y++) {
					var cssClass = verts[x] + hors[y], cell = row.insertCell(y);
					cell.className = cssClass;
					if (cssClass == 'centerCenter') {
						this.contentBox = new Element('div',{
							'class': 'modalContent',
							styles: {
								width: this.options.width
							}
						});
						cell.appendChild(this.contentBox);
					}
					else {
						document.id(cell).setStyle('opacity',0.4);
					}
				}
			}

		}
		
		//draw title
		if(this.options.title) {
			this.title = new Element('h2',{
				'class': 'modalTitle',
				html: this.options.title
			}).inject(this.contentBox);
			if(this.options.draggable && window['Drag'] != null) {
				this.draggable = true;
				new Drag(this.box,{ handle: this.title });
				this.title.addClass('modalDraggable');
			}
		}
		
		//draw message box
		this.messageBox = new Element('div',{
			'class': 'modalMessageBox',
			html: this.options.content || '',
			styles: {
				height: this.options.height
			}
		}).inject(this.contentBox);
		
		//button container
		this.buttonsBox = new Element('div',{
			'class': 'modalButtons'+(this.options.buttonsInTop?' top':' bottom'),
			styles: {
				display: 'none'
			}
		}).inject(this.contentBox,this.options.buttonsInTop?'top':'bottom');
		
		//draw overlay
		this.overlay = new Element('div',{
			html: '&nbsp;',
			styles: {
				opacity: 0
			},
			'class': 'modalOverlay',
			tween: {
				link: 'chain',
				duration: this.options.fadeDuration,
				onComplete: function() {
					if(this.overlay.getStyle('opacity') == 0) this.box.focus();
				}.bind(this)
			}
		}).inject(this.contentBox);
		if(!this.options.overlayAll) {
			this.overlay.setStyle('top',(this.title ? this.title.getSize().y - 1: 0));
		}
		
		//create initial buttons
		this.buttons = [];
		if(this.options.buttons.length) {
			this.options.buttons.each(function(button) {
				this.addButton(button.title,button.event,button.draggable);
			},this);
		}
		
		//create handle on draggable button
		
		//focus node
		this.focusNode = this.box;
		
		return this;
	},
	
	// Manage buttons
	addButton: function(title,clickEvent,draggable) {
		clickEvent = clickEvent === undefined ? this.close : clickEvent ;
		this.buttonsBox.setStyle('display','block');
		var focusClass = 'modalfocus';
		var label = new Element('label',{
			'class': 'modalLabel',
			events: {
				mousedown: function() {
					label.addClass(focusClass);
					var ev = function() {
						label.removeClass(focusClass);
						document.id(document.body).removeEvent('mouseup',ev);
					};
					document.id(document.body).addEvent('mouseup',ev);
				}
			}
		});

		if(draggable) {
			clickEvent = function(){};
			new Drag(this.box,{ handle: label });
			label.addClass('modalDraggable');
		}

		this.buttons[title] = (new Element('input',{
			type: 'button',
			value: title,
			events: {
				click: (clickEvent).bind(this)
			}
		}).inject(label));
		label.inject(this.buttonsBox);
		return this;
	},
	showButton: function(title) {
		if(this.buttons[title]) this.buttons[title].removeClass('hiddenButton');
		return this.buttons[title];
	},
	hideButton: function(title) {
		if(this.buttons[title]) this.buttons[title].addClass('hiddenButton');
		return this.buttons[title];
	},
	
	// Open and close box
	close: function(fast) {
		console.log(typeof(fast))
		console.log(typeof(fast))
		console.log(typeof(true))
		console.log(typeof(false))
		
		
		fast = typeof(fast)==="boolean" ? fast : false;
		if(this.isOpen) {
			this.box[fast ? 'setStyles' : 'tween']('opacity',0);
			this.fireEvent('close');
			this._detachEvents();
			this.isOpen = false;
		}
		return this;
	},
	
	open: function(fast) {
		fast = typeof(fast)==="boolean" ? fast : false;
		if(!this.isOpen) {
			this.box[fast ? 'setStyles' : 'tween']('opacity',1);
			if(this.resizeOnOpen) this._resize();
			this.fireEvent('open');
			this._attachEvents();
			(function() {
				this._setFocus();
			}).bind(this).delay(this.options.fadeDuration + 10);
			this.isOpen = true;
		}
		return this;
	},
	
	_setFocus: function() {
		this.focusNode.setAttribute('tabIndex',0);
		this.focusNode.focus();
	},
	
	// Show and hide overlay
	fade: function(fade,delay) {
		this._ie6Size();
		(function() {
			this.overlay.setStyle('opacity',fade || 1);
		}.bind(this)).delay(delay || 0);
		this.fireEvent('fade');
		return this;
	},
	unfade: function(delay) {
		(function() {
			this.overlay.fade(0);
		}.bind(this)).delay(delay || this.options.fadeDelay);
		this.fireEvent('unfade');
		return this;
	},
	_ie6Size: function() {
		if(this.ie6) {
			var size = this.contentBox.getSize();
			var titleHeight = (this.options.overlayAll || !this.title) ? 0 : this.title.getSize().y;
			this.overlay.setStyles({
				height: size.y - titleHeight,
				width: size.x
			});
		}
	},
	
	// Loads content
	load: function(content,title) {
		if(content) this.messageBox.set('html',content);
		if(title && this.title) this.title.set('html',title);
		this.fireEvent('complete');
		return this;
	},
	
	// Attaches events when opened
	_attachEvents: function() {
		this.keyEvent = function(e){
			if(this.options.keys[e.key]) this.options.keys[e.key].call(this);
		}.bind(this);
		this.focusNode.addEvent('keyup',this.keyEvent);
		
		this.resizeEvent = this.options.constrain ? function(e) { 
			this._resize(); 
		}.bind(this) : function() { 
			this._position(); 
		}.bind(this);
		window.addEvent('resize',this.resizeEvent);
		
		if(this.options.resetOnScroll) {
			this.scrollEvent = function() {
				this._position();
			}.bind(this);
			window.addEvent('scroll',this.scrollEvent);
		}
		
		return this;
	},
	
	// Detaches events upon close
	_detachEvents: function() {
		this.focusNode.removeEvent('keyup',this.keyEvent);
		window.removeEvent('resize',this.resizeEvent);
		if(this.scrollEvent) window.removeEvent('scroll',this.scrollEvent);
		return this;
	},
	
	// Repositions the box
	_position: function() {
		var windowSize = window.getSize(), 
			scrollSize = window.getScroll(), 
			boxSize = this.box.getSize();
		this.box.setStyles({
			left: scrollSize.x + ((windowSize.x - boxSize.x) / 2),
			top: scrollSize.y + ((windowSize.y - boxSize.y) / 2)
		});
		this._ie6Size();
		return this;
	},
	
	// Resizes the box, then positions it
	_resize: function() {
		var height = this.options.height;
		if(height == 'auto') {
			//get the height of the content box
			var max = window.getSize().y - this.options.pad;
			if(this.contentBox.getSize().y > max) height = max;
		}
		this.messageBox.setStyle('height',height);
		this._position();
	},
	
	// Expose message box
	toElement: function () {
		return this.messageBox;
	},
	
	// Expose entire modal box
	getBox: function() {
		return this.box;
	},
	
	// Cleanup
	destroy: function() {
		this._detachEvents();
		this.buttons.each(function(button) {
			button.removeEvents('click');
		});
		this.box.dispose();
		delete this.box;
	}
});
