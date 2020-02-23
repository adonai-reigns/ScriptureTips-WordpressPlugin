/* @licstart

            ####    SZ Booklet - jQuery Plugin v1.0    ####
            ####        Created by Serving Zion        ####

            There is no Copyright claimed against this file.
               Be free to use it as if you had made it!

    ##        God did not send His son to condemn the world,       ##
    ##          rather that through Him it might be saved.         ##
    ##   Get the facts: http://www.adonai-reigns.life/the-gospel   ##

@licend */



(function ($) {

    var SZBel = null;
    var _hideNavTimeout = null;
    var _hideShuntTimeout = null;
    var _options;
    var _pages = [];
    var _pageIndex = -1;
    var _events;
    var _viewSize = {};
    var _imageSize = {width: 0, height: 0, urlReplacement: {search: '', replace: ''}};


    String.prototype.ucfirst = function () {
        return this.charAt(0).toUpperCase() + this.slice(1);
    };

    var methods = {

        init: function (args, events) {

            args = args || {};
            events = events || {};
        
            SZBel = this;
            
            // we add a classname to the root element as a handle to target styles with and without browser support
            SZBel.addClass('ar-booklet-live');
            SZBel.removeClass('ar-booklet-nojs');
            
            // saving options to a global variable
            _options = args || {};
            _events = events || {};
            _events.prev = events.prev || {};
            _events.next = events.next || {};
            _events.goToPage = events.goToPage || {};
            
            _events.shuntLeft = events.shuntLeft || {};
            _events.shuntRight = events.shuntRight || {};
            _events.toc = events.toc || {};
            _events.toc.open = events.toc.open || {};
            _events.toc.close = events.toc.close || {};
            _events.calculateSizes = events.calculateSizes || {};
            
            _options.minimumHeight = _options.minimumHeight || 0;
            _options.minimumWidth = _options.minimumWidth || 0;
            _options.stretch = _options.stretch || 0;
            
            
            if(_options.stretch > 15){
                _options.stretch = 15;
            }
            if(_options.stretch < 0){
                _options.stretch = 0;
            }
            
            
            
            // navigation buttons for prev/next buttons
            _options.navigation = args.navigation || {};
            _options.navigation.hideOpacity = args.navigation.hideOpacity || 0.3;
            _options.navigation.showOpacity = args.navigation.showOpacity || 1;
            _options.navigation.timeout = args.navigation.timeout || 1600;

            // buttons for shunting page left or right if double page only displays one side at a time
            _options.shunt = args.shunt || {};
            _options.shunt.hideOpacity = args.shunt.hideOpacity || 0.3;
            _options.shunt.showOpacity = args.shunt.showOpacity || 1;
            _options.shunt.timeout = args.shunt.timeout || 400;
            _options.shunt.duration = args.shunt.duration || 600;
            _options.shunt.btnHideDuration = args.shunt.btnHideDuration || 300;
            
            // the table of contents
            _options.toc = args.toc || {};
            _options.toc.timeout = args.toc.timeout || 3250;
            _options.toc.showDuration = args.toc.showDuration || 140;
            _options.toc.hideDuration = args.toc.hideDuration || 260;

            // make calculations for page sizes and viewport size
            drawNav();
            calculateSizes();
            drawShunt();
            
            // need to do re-calculations every time that the mobile orientation changes
            $(window).on('orientationchange', function () {
                setTimeout(function (){
                    drawNav();
                    calculateSizes();
                    showShunt();
                    goToPage(_pageIndex, function(){
                        
                    });
                    
                }, 1000);
            });

            
            // the background image should be draggable, but with certain behavior
            $('.page.double .image', SZBel).draggable({
                axis: 'x',
                handle: '.d',// makes it inherit draggable api for button's sake, without draggable ui feature (disabled feature 20180328)
                stop: function () {
                    var xPos = $(this).position().left;

                    if ($(this).width() * 1 === $(this).parents(SZBel).width() * 1) {
                        // when the image is the same size as the viewport, it must always be aligned with the viewport
                        $(this).animate({
                            left: '0px'
                        });

                    } else {
                        if (xPos > 0) {
                            // has gone too far right, align left edges
                            $(this).animate({
                                left: '0px'
                            });
                            showShunt({
                                callback: function () {
                                    $('.shunt.left', SZBel).trigger('mouseenter');
                                    $('.shunt.left', SZBel).trigger('mouseleave');

                                }
                            });

                        } else if (xPos < 0 && xPos < 0 - $(this).width() / 2) {
                            // has gone too far left, align right edges
                            $(this).animate({
                                left: (0 - $(this).width() / 2) + 'px'
                            });
                            showShunt({
                                callback: function () {
                                    $('.shunt.right', SZBel).trigger('mouseenter');
                                    $('.shunt.right', SZBel).trigger('mouseleave');
                                }
                            });

                        } else {
                            // has not gone too far, leave it there and show shunt both ways
                            showShunt({
                                callback: function () {
                                    $('.shunt.left, .shunt.right', SZBel).trigger('mouseenter');
                                    $('.shunt.left, .shunt.right', SZBel).trigger('mouseleave');
                                }
                            });
                        }
                    }
                }
            });


            return this.each(function () {
                
                // store the page elements into a global variable array
                _pages = $('.page', SZBel).get();

                // build toc menu
                var tocOl = $('.toc .toc-items', SZBel);
                $('.toc ol li.generated', SZBel).remove();
                //$('.toc', SZBel).append(tocOl);
                $('.page', SZBel).each(function (i) {
                    var li = $('<li></li>');
                    li.text($(this).prop('title').replace(/\-/g, ' ').ucfirst())
                            .addClass('generated').on('click', function () {
                        goToPage(i);
                        closeToc();
                    });
                    tocOl.append(li);
                });
                
                // need to open a page - whether passed in by URI or go to the start
                var pageNum = 0;

                if (window.location.hash.length > 0) {
                    // they have followed a url to a specific page, find that page and turn to it

                    var slideName = window.location.hash.substr(1);

                    $('.page', SZBel).each(function (i) {
                        if ($(this).prop('id') === slideName) {
                            pageNum = i;
                        }
                    });
                }
                
                goToPage(pageNum);

            });

        }

    };


    var toggleTranscript = function(){
        
        if($(SZBel).hasClass('view-transcript')){
            $(SZBel).removeClass('view-transcript');
        }else{
            $(SZBel).addClass('view-transcript');
        }
        
        closeToc();
        
    };

    var drawNav = function () {
        
        
        $('.action-bar', SZBel).delegate('a.toggle-transcript', 'click', function () {
            toggleTranscript();
        });

        
        $('.nav', SZBel).delegate('.prev', 'click', function (e) {
          e.preventDefault();
          e.stopPropagation();
            prevPage();
        });

        $('.nav', SZBel).delegate('.next', 'click', function (e) {
          e.preventDefault();
          e.stopPropagation();
            nextPage();
        });

        $('.nav', SZBel).delegate('.page-number', 'click', function (e) {
          e.preventDefault();
          e.stopPropagation();
            toggleToc();
        });


        $(SZBel).delegate('.nav', 'mouseenter', function () {
            // show the menu when mouse is over it
            if (_hideNavTimeout !== null) {
                clearTimeout(_hideNavTimeout);
            }
            if(_options.navigation.hideOpacity*1 < _options.navigation.showOpacity*1){
                $('.nav', SZBel).stop().animate({
                    opacity: _options.navigation.showOpacity
                }, {
                    duration: 260
                });
            };
        });
        
        $(SZBel).delegate('.nav', 'mouseleave', function () {
            // hide the menu when mouse leaves it
            
            if(_options.navigation.hideOpacity*1 < _options.navigation.showOpacity*1){ // do not fade away the navigation if fading is disabled (eg position ouside)
                _hideNavTimeout = setTimeout(function () {
                    if($('.toc', SZBel).data('open') !== '1'){ 
                        // do not fade away the navigation if the toc is open)
                        $('.nav', SZBel).stop().animate({
                            opacity: _options.navigation.hideOpacity
                        }, {
                            duration: 800
                        });
                    };
                }, _options.navigation.timeout);
            };
        });
        
        if(_options.navigation.position === 'outside'){
            switch(_options.navigation.placement){
                case 'top':
                    $('.nav', SZBel).css({
                        top : '-'+$('.nav', SZBel).height()+'px'
                    });
                    $('.toc', SZBel).css({
                        top : 0
                    });
                    break;
                case 'bottom':
                default:
                    $('.nav', SZBel).css({
                        bottom : '-'+$('.nav', SZBel).height()+'px'
                    });
                    $('.toc', SZBel).css({
                        bottom : 0
                    });
                    break;
            }
            
        }else{
            switch(_options.navigation.placement){
                case 'top':
                    $('.nav', SZBel).css({
                        top : 0
                    });
                    $('.toc', SZBel).css({
                        top : $('.nav', SZBel).height()+'px'
                    });
                    break;
                case 'bottom':
                default:
                    $('.nav', SZBel).css({
                        bottom : 0
                    });
                    $('.toc', SZBel).css({
                        bottom : $('.nav', SZBel).height()+'px'
                    });
                    break;
            }
        }

    };

    /**
     * show the shunt buttons on the page, if appropriate
     * @param {type} options
     * @returns {undefined}
     */
    var showShunt = function (options) {

        if (!$('.page.active', SZBel).hasClass('double')) {
            // only show shunt buttons on double pages
            hideShuntButton('left');
            hideShuntButton('right');
            return;
        }

        var slideImage = $('.page.double.active .image', SZBel);
        var xPos = slideImage.position().left;


        if (xPos * 1 === $(SZBel).width() * 1) {
            // when the image is the same size as the viewport, it must always be aligned with the viewport
            slideImage.stop().animate({
                left: '0px'
            });

        } else {
            if (xPos > 0) {
                // has gone too far right, align left edges
                slideImage.stop().animate({
                    left: '0px'
                });
                hideShuntButton('right');
                showShuntButton('left');

            } else if (xPos < 0 && xPos < 0 - slideImage.stop().width() / 2) {
                // has gone too far left, align right edges
                slideImage.stop().animate({
                    left: (0 - slideImage.stop().width() / 2) + 'px'
                });
                hideShuntButton('right');
                showShuntButton('left');


            } else {
                // has not gone too far, leave it there and show shunt both ways
                showShuntButton('left');
                showShuntButton('right');

            }
        }

        if (typeof options !== 'undefined' && typeof options.callback === 'function') {
            // they might have deferred some other actions until after the shunt buttons have been created
            options.callback();
        }

    };

    /**
     * Attach event handlers to shunt buttons
     * @returns {undefined}
     */
    var drawShunt = function () {

        $(SZBel).delegate('.shunt', 'mouseenter', function () {
            if (_hideShuntTimeout !== null) {
                clearTimeout(_hideShuntTimeout);
            }
            $('.shunt', SZBel).animate({
                opacity: _options.shunt.showOpacity
            }, {
                duration: 260
            });
        });
        
        $(SZBel).delegate('.shunt', 'mouseleave', function () {
            _hideShuntTimeout = setTimeout(function () {
                $('.shunt', SZBel).animate({
                    opacity: _options.shunt.hideOpacity
                }, {
                    duration: 800
                });
            }, _options.shunt.timeout);
        });

        $('.shunt.left', SZBel).delegate('.btn', 'click', function () {
            shuntRight();
        });
        
        $('.shunt.right', SZBel).delegate('.btn', 'click', function () {
            shuntLeft();
        });

    };

    var hideShuntButton = function (side) {

        $('.shunt.' + side, SZBel).animate({
            opacity: 0
        }, _options.shunt.btnHideDuration, function () {
            
            $(this).css({
                display: 'none'
            });
        });
    };

    var showShuntButton = function (side) {

        if ($('.shunt.' + side, SZBel).data('state') === 'visible') {
            return;
        }

        $('.shunt.' + side, SZBel).css({
            display: 'block',
            opacity: 0
        });

        $('.shunt.' + side, SZBel).animate({
            opacity: 1
        }, _options.shunt.btnHideDuration);

        setTimeout(function () {
            $('.shunt.' + side, SZBel).trigger('mouseleave');
        }, _options.shunt.duration);

    };

    var shuntLeft = function () {
        
        var _f_ = function(){
            $('.page.double .image, .page.double .transcripts', SZBel).animate({
                left: '-' + Math.floor($('.page.double.active', SZBel).width()) + 'px'
            }, _options.shunt.duration);
            hideShuntButton('right');
            showShuntButton('left');
            
            if(typeof _events.shuntLeft.after === 'function'){
                _events.shuntLeft.after();
            }
        };
        
        if(typeof _events.shuntLeft.before === 'function'){
            _events.shuntLeft.before(_f_);
        }else{
            _f_();
        }
        
    };
    var shuntRight = function () {
        
        var _f_ = function(){
            $('.page.double .image, .page.double .transcripts', SZBel).animate({
                left: '0px'
            }, _options.shunt.duration);
            hideShuntButton('left');
            showShuntButton('right');
            
            if(typeof _events.shuntLeft.after === 'function'){
                _events.shuntRight.after();
            }
        };
        
        if(typeof _events.shuntRight.before === 'function'){
            _events.shuntRight.before(_f_);
        }else{
            _f_();
        }
        
    };


    var closeToc = function () {
        
        var _f_ = function(){
            $('.toc', SZBel).animate({
                opacity: 0.5
            }, _options.toc.hideDuration, function () {
                $('.toc', SZBel).css({
                    display: 'none'
                });

                $('.toc', SZBel).data('open', '0');
            });
            
            if(typeof _events.toc.close.after === 'function'){
                _events.toc.close.after(function(){});
            }
        };
        
        if(typeof _events.toc.close.before === 'function'){
            _events.toc.close.before(_f_);
        }else{
            _f_();
        }

    };

    var toggleToc = function () {
        if ($('.toc', SZBel).data('open') === '1') {
            closeToc();
        } else {
            openToc();
        }
    };

    var openToc = function () {

        var _f_ = function(){

            var toc = $('.toc', SZBel);

            toc.css({
                display: 'block',
                opacity: 0
            });
             
            var sn = $('.site-name a', SZBel);
            
            var i = 0;
            
            // make sure the page title has 10% margins on either side
            while(i < 300 && (sn.width()*1+(sn.width()*0.2)) >= toc.width()){
                var fs = sn.css('font-size');
                fs = fs.replace(/[^0-9\.]/g, '')*1;
                fs -= 0.1;
                sn.css('font-size', fs+'px');
                i++;
            }
            
            
            $('.toc', SZBel).animate({
                opacity: 1
            }, _options.toc.showDuration, function () {
                $('.toc', SZBel).data('open', '1');
            });

            if(typeof _events.toc.open.after === 'function'){
                _events.toc.open.after(function(){});
            }

        };
        
        if(typeof _events.toc.open.before === 'function'){
            _events.toc.open.before(_f_);
        }else{
            _f_();
        }

    };


    // shows the selected slide
    var makeVisible = function (el) {

        // find out the maximum proportions
        var iW = 40;
        var vW = 0;
        var iH = _imageSize.height * 1;
        
        var imageWidth = null;
        var imageHeight = null;
        var isDbl = $(el).hasClass('double') ? true : false;
        var showDbl = false;

        if (isDbl) {
            // we only show half the width of this page, the other half is as a swipeable background
            iW = _imageSize.width * 1;
        } else {
            // use the full width of the image
            iW = _imageSize.width * 2;
            iW = (_imageSize.height * 1) * 1;
        }

        // if the screen is wide enough to host the double-sized page, then let's do that!
        var vpWidth = _options.viewportWidth || $(window).width();
        
        if (isDbl && vpWidth >= ((_imageSize.width * 2))) {
            // make the view size twice the config setting.. 
            vW = _imageSize.width * 2;
            showDbl = true;
        } else if (!isDbl) {
            // make the view size according to the config setting
            vW = _imageSize.width;
        } else {
            vW = _imageSize.width;
        }

        // find out what the greater proportion is
        var propMode = null;

        if (iW <= _viewSize.width && iH <= _viewSize.height) {
            // image is smaller than viewport, no resizing!
            propMode = 'n';

        } else if (iW <= _viewSize.width && iH >= _viewSize.height) {
            propMode = 'v';

        } else if (iH <= _viewSize.height && iW >= _viewSize.width) {
            propMode = 'h';

        } else {
            if ((100 / iW) * _viewSize.width >= (100 / iH) * _viewSize.height) {
                propMode = 'v';
            } else {
                propMode = 'h';
            }
        }


        switch (propMode) {
            case 'h':
                // horizontal rules

                if (isDbl) {
                    imageWidth = _viewSize.width;
                    imageHeight = Math.floor(((100 / iW) * _viewSize.width) * (iH / 100));
                } else {
                    imageWidth = _viewSize.width;
                    imageHeight = Math.floor(((100 / (_imageSize.width)) * _viewSize.width) * (iH / 100));
                }


                break;
            case 'v':
                // vertical rules
                imageHeight = _viewSize.height;
                imageWidth = Math.floor(((100 / iH) * _viewSize.height) * (iW / 100));
                if (!isDbl) {
                    imageWidth = Math.floor(imageWidth * 2);
                }
                break;
            case 'n':
                // no change
                imageHeight = iH;
                imageWidth = iW;
                break;
        }
        
        $(el).show().css({
            width: vW + 'px',
            'max-width': vW + 'px',
            height: imageHeight + 'px',
            position: 'relative',
            overflow: 'hidden'
        }).addClass('active');

        $(SZBel).css({
            width: vW + 'px',
            'max-width': vW + 'px'
        });

        // get the background image url
        var bgImage = $('.image', el).css('background-image');
        bgImage = bgImage.replace('url(','').replace(')','').replace(/\"/gi, "");
        
        // this allows us to use different url paths to images for different screen sizes
        bgImage = bgImage.replace(_imageSize.urlReplacement.search, _imageSize.urlReplacement.replace);
        
        // show the whole image if it is a single slide, or if the viewport is sufficient for both pages
        var bgWidth = '100%';

        // begin the slide position centred, so that transition appears upon load
        var leftPos = Math.floor(imageWidth / 2);

        if (isDbl && !showDbl) {
            // only showing half of the image, so we stretch the background image to twice the containing element's width
            bgWidth = '200%';
            
//            $('.transcript', el).css({
//                width: '100%'
//            });
//            
        }
        
        
         $('.transcript', el).each(function(){
           
           if(!$(this).hasClass('fullwidth')){
            $(this).css({
              width: '50%'
            });
           }
         });
           

        if (isDbl && showDbl) {
            // don't begin a transition upon slide load..
            leftPos = 0;
        }
        
        
        $('.transcripts', el).css({
            height: '100%',
            left: ((isDbl) ? '-' + leftPos + 'px' : 0),
            width: bgWidth,
            'background-image': 'url("' + bgImage + '")',
            'background-size': '100% 100%',
            position: 'absolute'
        });


        $('.image', el).css({
            height: '100%',
            left: ((isDbl) ? '-' + leftPos + 'px' : 0),
            width: bgWidth,
            'background-image': 'url("' + bgImage + '")',
            'background-size': '100% 100%',
            position: 'absolute'
        });

        if (isDbl && !showDbl) {
            if ($(el).data('first-side') === 'right') {
                shuntLeft();
            } else {
                shuntRight();
            }

        } else {
            $('.shunt', SZBel).hide();
        }

    };


    var showNavigation = function () {

        if (_hideNavTimeout !== null) {
            clearTimeout(_hideNavTimeout);
        }

        $('.prev, .next', SZBel).show();
        $('.page-number', SZBel).text((_pageIndex + 1) + ' of ' + (_pages.length));

        if (!_options.loop) {
            if (_pageIndex <= 0) {
                // hide prev button
                $('.prev', SZBel).hide();
            } else if ((_pageIndex+1) >= _pages.length) {
                // hide next button
                $('.next', SZBel).hide();
            }
        }

        
        $('.nav', SZBel).css({
            visibility: 'visible',
            opacity: 0
        });
        
        if(_options.navigation.hideOpacity*1 < _options.navigation.showOpacity){
            $('.nav', SZBel).animate({
                opacity: _options.navigation.showOpacity
            }, {
                duration: 800
            });

            _hideNavTimeout = setTimeout(function () {
                $('.nav', SZBel).animate({
                    opacity: _options.navigation.hideOpacity
                }, {
                    duration: 800
                });
            }, _options.navigation.timeout);

        }else{
            $('.nav', SZBel).css({
                visibility: 'visible',
                opacity: 1
            });
        };

        
    };



    var calculateSizes = function (cb) {
        
        if(typeof cb !== 'function'){
            cb = function(){};
        }
        
        var _f_ = function(){
        
            var navHeight = $('.nav', SZBel).height();
            
            _options.vpWidth = _options.viewportWidth || $(window).width();
            _options.vpHeight = _options.viewportHeight || $(window).height();
            
            var wW = _options.vpWidth; 
            var wH = _options.vpHeight;
            
            
            
            var wHadd = 0;
            if(_options.navigation.position === 'outside'){
                // account for the height of the navigation in calculation
                wHadd = navHeight;
            };
            
            
            if(wH < (_options.minimumHeight + wHadd)){
                wH = (_options.minimumHeight+wHadd);
            }
            if(wW < _options.minimumWidth){
                wW = _options.minimumWidth;
            }
            
            _viewSize.width = wW;
            _viewSize.height = wH;
            
            

            _imageSize.width = 0;
            _imageSize.height = 0;

            // choose an optimum image size from the settings (useful for serving scaled images depending upon screen sizes)
            if (_options.imageSizes) {

                for (var i = (_options.imageSizes.length-1); i>=0; i--) {
                    var sSize = _options.imageSizes[i];

                    if ( (sSize.height > _viewSize.height)) {
                        _imageSize.width = Math.floor(sSize.width / 2) || _imageSize.width;
                        _imageSize.height = sSize.height || _imageSize.height;
                        _imageSize.urlReplacement = sSize.urlReplacement || _imageSize.urlReplacement;
                    }
                }

            }

            // image size defaults to the screen size
            if (_imageSize.width <= 0) {
                _imageSize.width = wW;
            }
            if (_imageSize.height <= 0) {
                _imageSize.height = wH;
            }
            
            
            
            var tW = wW;
            var tH = wH;
            var origImgW = _imageSize.width;
            var origImgH = _imageSize.height;
            
            if(_options.navigation.position === 'outside'){
                // account for the height of the navigation in calculation
                tH = Math.floor(wH-navHeight);
            };
            
            if(_imageSize.height < tH){
                // height proportional
                var imgW = tW;
                var imgH = Math.floor(((100/_imageSize.width)*imgW)*(_imageSize.height/100));
                
                _viewSize.width = (imgW);
                _viewSize.height = imgH;
                _imageSize.width = imgW;
                _imageSize.height = imgH;
                
                $(SZBel).css({
                    width: _viewSize.width + 'px',
                    margin: 'auto'
                });
                
            }else{ 
                // width proportional
                var imgH = tH;
                
                var imgW = Math.floor(((100/_imageSize.height)*imgH)*(_imageSize.width/100));
                
                if(imgW*2<wW){
                    _viewSize.width = (imgW*2);
                    _imageSize.width = imgW*2;
                }else{
                    _viewSize.width = (imgW);
                    _imageSize.width = imgW;
                }
                
                
                _viewSize.height = imgH;
                _imageSize.height = imgH;
                
                $(SZBel).css({
                    margin: 'auto 0'
                });
                
            }


            if(_options.navigation.position === 'outside' && _options.navigation.placement === 'top'){
                // adjust margins to make room for the navigation
                $(SZBel).css({
                    'margin-top' : $('.nav', SZBel).height()+'px',
                    'margin-bottom' : '-'+navHeight+'px'
                });
            };
            
            
            
            if(_viewSize.height > _options.vpHeight){
                // the image is too tall to fit on the window, there is scroll bars, why not stretch to fill horizontally?
                
                if(_viewSize.width < wW){
                    
                    //_viewSize.height = Math.floor(_viewSize.height*((100/(_imageSize.width*2))/(100/$(window).width())));
                    
                    if(_options.navigation.position === 'outside'){
                        // image height at this stage includes the height of the nav bar, remove that
                        _viewSize.height = _viewSize.height - navHeight;
                    }
                    
                    _imageSize.height = ((100/origImgW)*_imageSize.width)*(origImgH/100);
                    
                    _viewSize.width = _options.vpWidth;
                    //_imageSize.width = Math.floor(_viewSize.width/2);
                    
                }
                
            }
            
            if(_imageSize.width < _options.vpWidth){
                // image does not fill the entire window, see if we should stretch it
                
                if(_options.stretch > 0){
                    
                    if((100-(((100/_options.vpWidth)*(_viewSize.width/100)))*100) <= _options.stretch){
                        // it's within the range for stretching
                        
                        
                        _viewSize.width = _options.vpWidth;
                        _imageSize.width = Math.floor(_viewSize.width);
                        
                    }
                    
                }
                
            }
            
            if(_viewSize.width === _imageSize.width){
                
                if(_viewSize.width > _viewSize.height){
                    // landscape
                    if(_imageSize.width/2 > _options.minimumWidth){
                        _imageSize.width = Math.floor(_imageSize.width/2);
                    }
                }
                
            }
            
            
            if(typeof _events.calculateSizes.after === 'function'){
                _events.calculateSizes.after(cb);
            }else{
                cb();
            }


        };
        
        if(typeof _events.calculateSizes.before === 'function'){
            _events.calculateSizes.before(_f_);
        }else{
            _f_();
        }

    };

    var makeInvisible = function (el) {
        if (!$(el).is(':hidden')) {
            $(el).hide();
            $(el).removeClass('active');
        }
    };

    var goToPage = function (index, cb) {

        var _f_ = function(){
            
            _pageIndex = index;

            $('.page', SZBel).each(function (i) {

                if (i * 1 === index * 1) {
                    // show this page
                    makeVisible(this);

                    if ($(this).prop('id') !== 'undefined') {

                        if(history.pushState){
                          history.pushState(null, null, '#' + $(this).prop('id'));
                        }else{
                          location.hash = $(this).prop('id');
                        }
                      
                        var url = window.location.href;
                        var bgImage = $('.image', this).css('background-image');
                        bgImage = bgImage.replace('url(','').replace(')','').replace(/\"/gi, "");
                        
                        addthis_share = {
                            url: url,
                            title: $(this).prop('title'),
                            //description: "THE DESCRIPTION",
                            media: bgImage
                         }

                        
                        
                    }

                    showNavigation();

                } else {
                    // hide this page
                    makeInvisible(this);

                }
            });
            
            

            if(typeof _events.goToPage.after === 'function'){
                _events.goToPage.after(cb);
            }else{
                if(typeof cb === 'function'){
                    cb();
                }
            }
        
        };
        
        if(typeof _events.goToPage.before === 'function'){
            _events.goToPage.before(_f_);
        }else{
            _f_();
        }
        
        

    };

    var nextPage = function () {
        
        var _f_ = function(){
            
            var i = _pageIndex;
            i++;

            if (i > _pages.length) {
                // has progressed already to the last page.. decide what to do!

                if (_options.loop) {
                    // go to page 1
                    i = 0;

                } else {
                    // ignore the action
                    return;
                }
            } else {
                goToPage(i);
            }
            
            if(typeof _events.next.after === 'function'){
                _events.next.after();
            }
        
        };
        
        if(typeof _events.next.before === 'function'){
            _events.next.before(_f_);
        }else{
            _f_();
        }
        
        
    };

    var prevPage = function () {

        var _f_ = function(){

            var i = _pageIndex;
            i--;

            if (i < 0) {
                // has retracted past the first page.. decide what to do!

                if (_options.loop) {
                    // go to last page
                    i = (this.pages.length - 1);
                    this.goTo(i);

                } else {
                    // ignore the action
                    return;
                }
            } else {
                goToPage(i);
            }
            
            
            if(typeof _events.prev.after === 'function'){
                _events.prev.after();
            }
        
        
        };
        
        if(typeof _events.prev.before === 'function'){
            _events.prev.before(_f_);
        }else{
            _f_();
        }
        
        
    };




    $.fn.szBooklet = function (method) {
        
        if (methods[method]) {
            return methods[ method ].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.szBooklet');
        }


    };

})(jQuery);



