﻿/*
 * jQuery UI AriaLightbox (22.04.10)
 * http://github.com/fnagel/jQuery-Accessible-RIA
 *
 * Copyright (c) 2009 Felix Nagel for Namics (Deustchland) GmbH
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 *
 * Depends: ui.core.js 1.8
 */
(function(a){a.widget("ui.ariaLightbox",{version:"1.8",options:{altText:function(){return a(this).find("img").attr("alt");},descText:function(){return a(this).find("img").attr("title");},prevText:"previous picture",nextText:"next picture",titleText:"Lightbox",pictureText:"Picture",ofText:"of",closeText:"Close [ESC]",pos:"auto",autoHeight:50,offsetX:10,offsetY:10,disableWidth:550,disableHeight:550,useDimmer:true,animationSpeed:"slow",zIndex:1000,background:"black",opacity:0.8,makeHover:true,em:0.0568182,activeImage:0},_create:function(){var c=this.options,b=this;if(c.imageArray){c.selector=c.imageArray;c.imageArray=b.element.find(c.imageArray);if(c.makeHover){c.imageArray.each(function(){b._makeHover(a(this));});}}else{if(c.makeHover){b._makeHover(b.element);}}b.element.click(function(d){if(!c.imageArray){b._open(a(this),d);return false;}else{target=a(d.target).closest(c.selector,b.element);if(target.length){c.activeImage=c.imageArray.index(target);b._open(target,d);return false;}}});if(c.useDimmer){a(window).resize(function(){if(!c.disabled){b._dimmerResize();}});}},startGallery:function(c,b){b=(b)?b:0;this.options.activeImage=b;this._open(a(this.options.imageArray[b]),c);},_open:function(d,e){var c=this.options,b=this;if(!c.disabled&&a(window).width()-c.disableWidth>0&&a(window).height()-c.disableHeight>0){c.clickedElement=e.currentTarget;c.wrapperElement=a("#ui-lightbox-wrapper");if(!c.wrapperElement.length){b._show(d,e);}else{b._changePicture(d,e);}}},_show:function(f,b){var m=this.options,l=this;var j="\n";j+='<div id="ui-lightbox-wrapper" style="z-index:'+m.zIndex+1+';" class="ui-dialog ui-widget ui-widget-content ui-corner-all" tabindex="-1" role="dialog" aria-labelledby="ui-dialog-title-dialog">'+"\n";j+='	<div class="ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix">'+"\n";j+='		<span class="ui-dialog-title" id="ui-dialog-title-dialog">'+m.titleText+"</span>"+"\n";j+='		<a href="#nogo" id="ui-lightbox-close" class="ui-dialog-titlebar-close ui-corner-all" title="'+m.closeText+'" role="button">'+"\n";j+='			<span class="ui-icon ui-icon-closethick">'+m.closeText+"</span>"+"\n";j+="		</a>"+"\n";j+="	</div>"+"\n";j+='	<div id="ui-lightbox-content">'+"\n";j+='		<div id="ui-lightbox-image"><img src="" aria-describedby="ui-lightbox-description" /></div>'+"\n";j+='		<p id="ui-lightbox-description"></p>'+"\n";if(m.imageArray){j+='		<p id="ui-lightbox-pager"></p>'+"\n";j+='		<div id="ui-dialog-buttonpane" class="ui-dialog-buttonpane ui-widget-content ui-helper-clearfix">'+"\n";j+='			<button id="ui-lightbox-next" type="button" class="ui-state-default ui-corner-all">'+m.nextText+"</button>"+"\n";j+='			<button id="ui-lightbox-prev" type="button" class="ui-state-default ui-corner-all">'+m.prevText+"</button>"+"\n";j+="		</div>"+"\n";}j+="	</div>	"+"\n";j+="</div>"+"\n";if(m.useDimmer){l._lightboxCreate();}a("body").append(j);l._trigger("onShow",0);m.wrapperElement=a("#ui-lightbox-wrapper");if(m.imageArray){m.wrapperElement.keydown(function(n){if(n.keyCode==a.ui.keyCode.RIGHT){l.next();}if(n.keyCode==a.ui.keyCode.DOWN){l.next();}if(n.keyCode==a.ui.keyCode.UP){l.prev();}if(n.keyCode==a.ui.keyCode.LEFT){l.prev();}if(n.keyCode==a.ui.keyCode.SPACE){l.next();}if(n.keyCode==a.ui.keyCode.END){m.activeImage=m.imageArray.length-2;n.preventDefault();l.next();}if(n.keyCode==a.ui.keyCode.HOME){m.activeImage=1;n.preventDefault();l.prev();}});m.buttonpane=m.wrapperElement.find("#ui-dialog-buttonpane");l._setButtonState();var d=m.buttonpane.find("#ui-lightbox-prev");d.click(function(){l.prev();});l._makeHover(d);var i=m.buttonpane.find("#ui-lightbox-next");i.click(function(){l.next();});l._makeHover(i);}m.wrapperElement.keydown(function(n){if(n.keyCode==a.ui.keyCode.ESCAPE){l.close();}});var k=m.wrapperElement.find("#ui-lightbox-close");k.click(function(){l.close();return false;});l._makeHover(k);switch(m.pos){case"auto":var c=l._pageScroll();var e=((a(document).width()-m.wrapperElement.width())/2);var h=c[1]+m.autoHeight;break;case"offset":var e=b.pageX+m.offsetX;var h=b.pageY-m.offsetY;break;default:var g=m.pos.split(",");var e=g[0];var h=g[1];break;}m.wrapperElement.css({left:e+"px",top:h+"px"}).fadeIn(m.animationSpeed).focus();l._changePicture(f,b);},_changePicture:function(e,g){var d=this.options,b=this;var c=d.wrapperElement.find("#ui-lightbox-content");var f=c.find("#ui-lightbox-image");var h=f.find("img");h.fadeOut(d.animationSpeed,function(){c.attr("aria-live","assertive").attr("aria-relevant","additions removals text").attr("aria-busy",true);var i=new Image();i.onload=function(){h.attr("src",e.attr("href")).attr("alt",d.altText.call(e));var k=(d.em)?i.width*d.em+"em":i.width;var j=(d.em)?i.height*d.em+"em":i.height;h.css({width:k,height:j});switch(d.pos){case"offset":d.wrapperElement.animate({left:g.pageX+d.offsetX+"px",top:g.pageY+d.offsetY+"px",width:k},d.animationSpeed);break;case"auto":default:d.wrapperElement.animate({left:((a(document).width()-i.width)/2)+"px",width:k},d.animationSpeed);break;}f.animate({height:j},d.animationSpeed,function(){h.fadeIn(d.animationSpeed);d.wrapperElement.find("#ui-lightbox-description").text(d.descText.call(e));if(d.imageArray){d.wrapperElement.find("#ui-lightbox-pager").text(d.pictureText+" "+(d.activeImage+1)+" "+d.ofText+" "+d.imageArray.length);}if(d.useDimmer){b._dimmerResize();}b._updateVirtualBuffer();c.attr("aria-busy",false);b._trigger("onChangePicture",0);});i.onload=function(){};};i.src=e.attr("href");});},_setButtonState:function(){var b=this.options;b.buttonpane.find("#ui-lightbox-next, #ui-lightbox-prev").removeAttr("disabled").removeClass("ui-state-disabled").removeClass("ui-state-focus");switch(b.activeImage){case 0:b.buttonpane.find("#ui-lightbox-prev").attr("disabled","disabled").removeClass("ui-state-hover").addClass("ui-state-disabled");b.buttonpane.find("#ui-lightbox-next").focus();break;case b.imageArray.length-1:b.buttonpane.find("#ui-lightbox-next").attr("disabled","disabled").removeClass("ui-state-hover").addClass("ui-state-disabled");b.buttonpane.find("#ui-lightbox-prev").focus();break;}},close:function(){var c=this.options,b=this;a(c.clickedElement).parent().focus();c.wrapperElement.fadeOut(c.animationSpeed,function(){a(this).remove();});if(c.useDimmer){a("#ui-lightbox-screendimmer").fadeOut(c.animationSpeed,function(){a(this).remove();});}a(c.clickedElement).focus();b._trigger("onClose",0);},prev:function(){var c=this.options,b=this;if(c.imageArray&&c.activeImage>0){c.activeImage=c.activeImage-1;b._changePicture(a(c.imageArray[c.activeImage]));b._setButtonState();b._trigger("onPrev",0);}},next:function(){var c=this.options,b=this;if(c.imageArray&&c.activeImage<(c.imageArray.length-1)){c.activeImage=c.activeImage+1;b._changePicture(a(c.imageArray[c.activeImage]));b._setButtonState();b._trigger("onNext",0);}},_lightboxCreate:function(){var c=this.options,b=this;var d='<div id="ui-lightbox-screendimmer" style="display: none;"></div>';a("body").append(d);a("#ui-lightbox-screendimmer").css({width:b._dimmerWidth()+"px",height:b._dimmerHeight()+"px",zIndex:c.zIndex,background:c.background,position:"absolute",top:"0px",left:"0px",opacity:c.opacity}).fadeIn(c.animationSpeed).click(function(){b.close();});},_dimmerResize:function(){var c=this;var e=a("#ui-lightbox-screendimmer");if(e.length){e.css({width:0,height:0});var d=c._pageScroll();var b=(d[0]==0)?c._dimmerWidth():d[0];e.css({width:b+"px",height:c._dimmerHeight()+"px"});}},_dimmerHeight:function(){if(a.browser.msie&&a.browser.version<7){var c=Math.max(document.documentElement.scrollHeight,document.body.scrollHeight);var b=Math.max(document.documentElement.offsetHeight,document.body.offsetHeight);if(c<b){return a(window).height();}else{return c;}}else{return a(document).height();}},_dimmerWidth:function(){if(a.browser.msie&&a.browser.version<7){var b=Math.max(document.documentElement.scrollWidth,document.body.scrollWidth);var c=Math.max(document.documentElement.offsetWidth,document.body.offsetWidth);if(b<c){return a(window).width();}else{return b;}}else{return a(document).width();}},_pageScroll:function(){var c,b;if(self.pageYOffset){b=self.pageYOffset;c=self.pageXOffset;}else{if(document.documentElement&&document.documentElement.scrollTop){b=document.documentElement.scrollTop;c=document.documentElement.scrollLeft;}else{if(document.body){b=document.body.scrollTop;c=document.body.scrollLeft;}}}arrayPageScroll=new Array(c,b);return arrayPageScroll;},_makeHover:function(b){b.bind("mouseenter",function(){a(this).addClass("ui-state-hover");}).bind("mouseleave",function(){a(this).removeClass("ui-state-hover");}).bind("focus",function(){a(this).addClass("ui-state-focus");}).bind("blur",function(){a(this).removeClass("ui-state-focus");});},_updateVirtualBuffer:function(){var c=a("#virtualBufferForm");if(c.length){(c.val()=="1")?c.val("0"):c.val("1");}else{var b='<form><input id="virtualBufferForm" type="hidden" value="1" /></form>';a("body").append(b);}},destroy:function(){var b=this.options;if(b.makeHover){if(b.imageArray){b.imageArray.each(function(){a(this).unbind("mouseleave mouseenter focus blur");});}else{this.element.unbind("mouseleave mouseenter focus blur");}}this.element.unbind(".ariaLightbox").unbind("click").removeData("ariaLightbox");a("#virtualBufferForm").parent().remove();a("#ui-lightbox-screendimmer").remove();a("#ui-lightbox-wrapper").unbind("keydown").remove();}});})(jQuery);
