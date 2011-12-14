/*
 * jQuery UI AriaTabs (31.01.11)
 * http://github.com/fnagel/jQuery-Accessible-RIA
 *
 * Copyright (c) 2009 Felix Nagel for Namics (Deustchland) GmbH
 * Copyright (c) 2010-2011 Felix Nagel
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 *
 * Depends: jQuery UI
 *   		jQuery UI Tabs
 * Optional: jQuery Address Plugin
 */
(function(a){a.fn.extend(a.ui.tabs.prototype,{_create:function(){var c=this,d=this.options,x,b="#";if(a.address){var e={enable:true,title:{enable:true,split:" | "}};if(!a.isEmptyObject(d.jqAddress)){a.extend(true,e,d.jqAddress);}else{d.jqAddress={};}a.extend(true,d.jqAddress,e);}if(a.address&&d.jqAddress.enable){b="#"+a.address.value().replace("/","");}c._tabify(true);this.anchors.bind(d.event+".tabs-accessibility",function(){this.focus();});c.list.attr("role","tablist");for(x=0;x<c.anchors.length;x++){if(a.address&&d.jqAddress.enable&&b!="#"&&a(c.anchors[x]).attr("href")==b){c.select(x);}c._ariaInit(x);}c.list.keydown(function(g){var f=false;switch(g.keyCode){case a.ui.keyCode.RIGHT:c.select(d.selected+1);break;case a.ui.keyCode.DOWN:c.select(d.selected+1);f=true;break;case a.ui.keyCode.UP:c.select(d.selected-1);break;case a.ui.keyCode.LEFT:c.select(d.selected-1);break;case a.ui.keyCode.END:c.select(c.anchors.length-1);break;case a.ui.keyCode.HOME:c.select(0);break;}return f;});if(a.address&&this.options.jqAddress.enable){a.address.externalChange(function(h){var g="#"+h.value.replace("/","");var f=0;while(f<c.anchors.length){if(a(c.anchors[f]).attr("href")==g){c.select(f);return;}f++;}});}c.initiated=true;},_original_load:a.ui.tabs.prototype.load,load:function(b){if(a.address&&this.options.jqAddress.enable){if(a(this.anchors[0]).attr("aria-selected")!==undefined){if(this.options.forceFirst===0&&b!==0){if(a.address.value()==""){a.address.history(false);}a.address.value(a(this.anchors[0]).attr("href").replace(/^#/,""));a.address.history(true);this.options.forceFirst=false;}if(this.options.jqAddress.title.enable){a.address.title(a.address.title().split(this.options.jqAddress.title.split)[0]+this.options.jqAddress.title.split+a(this.anchors[b]).text());}a.address.value(a(this.anchors[b]).attr("href").replace(/^#/,""));}else{this.options.forceFirst=b;}}for(x=0;x<this.anchors.length;x++){this._ariaSet(x,false);if(a.data(this.anchors[x],"href.tabs")){a(this.panels[x]).removeAttr("aria-live").removeAttr("aria-busy");}}if(a.data(this.anchors[b],"href.tabs")){a(this.panels[b]).attr("aria-live","polite").attr("aria-busy","true");}this._original_load(b);if(a.data(this.anchors[b],"href.tabs")){a(this.panels[b]).attr("aria-busy","false");}this._ariaSet(b,true);},_ariaSet:function(c,e){var d=(e)?0:-1;var b=a(this.anchors[c]);b.attr("tabindex",d).attr("aria-selected",e);if(e){if(!a.browser.msie&&this.initiated){b.focus();}}else{b.closest("li").removeClass("ui-state-focus");}a(this.panels[c]).attr("aria-hidden",!e).attr("aria-expanded",e);if(a.browser.msie&&this.initiated){this.options.timeout=window.setTimeout(function(){b.focus();},100);}if(e){this._updateVirtualBuffer();}},_ariaInit:function(c){var b=this;var d=a(this.panels[c]).attr("id");a(this.anchors[c]).attr("aria-controls",d).attr("id",d+"-tab").parent().attr("role","tab");a(this.panels[c]).attr("role","tabpanel").attr("tabindex",0).attr("aria-labelledby",d+"-tab");if(this.options.collapsible){a(this.anchors[c]).bind(this.options.event,function(e){b._ariaSet(c,!a(b.panels[c]).hasClass("ui-tabs-hide"));});}},_original_add:a.ui.tabs.prototype.add,add:function(d,c,b){this._original_add(d,c,b);this.element.attr("aria-live","polite").attr("aria-relevant","additions");if(b){this._ariaInit(b);this._ariaSet(b,false);}else{this._ariaInit(this.anchors.length-1);this._ariaSet(this.anchors.length-1,false);}},_original_remove:a.ui.tabs.prototype.remove,remove:function(b){this._original_remove(b);this.element.attr("aria-live","polite").attr("aria-relevant","removals");},_original_destroy:a.ui.tabs.prototype.destroy,destroy:function(){var b=this,c=this.options;b.element.removeAttr("role").removeAttr("aria-live").removeAttr("aria-relevant");b.list.removeAttr("role");for(x=0;x<b.anchors.length;x++){a(b.anchors[x]).removeAttr("aria-selected").removeAttr("aria-controls").removeAttr("role").removeAttr("id").removeAttr("tabindex").parent().removeAttr("role");a(b.panels[x]).removeAttr("aria-hidden").removeAttr("aria-expanded").removeAttr("aria-labelledby").removeAttr("aria-live").removeAttr("aria-busy").removeAttr("aria-relevant").removeAttr("role");}a("body>form #virtualBufferForm").parent().remove();this._original_destroy();},_updateVirtualBuffer:function(){var b=a("body>form #virtualBufferForm");if(b.length){if(b.val()=="1"){b.val("0");}else{b.val("1");}if(b.hasClass("ui-accessibility-odd")){b.addClass("ui-accessibility-even").removeClass("ui-accessibility-odd");}else{b.addClass("ui-accessibility-odd").removeClass("ui-accessibility-even");}}else{a("body").append('<form><input id="virtualBufferForm" type="hidden" value="1" /></form>');}}});})(jQuery);