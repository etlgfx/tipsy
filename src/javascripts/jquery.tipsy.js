// tipsy, facebook style tooltips for jquery
// version 1.0.0a
// (c) 2008-2010 jason frame [jason@onehackoranother.com]
// released under the MIT license

define([
    "jquery",
    "lodash"
], function($, _) {

    'use strict';

    function maybeCall(thing, ctx) {
        return (typeof thing == 'function') ? (thing.call(ctx)) : thing;
    }

    function isElementInDOM(ele) {
        while (ele == ele.parentNode) {
            if (ele == document) {
                return true;
            }
        }
        return false;
    }

    function Tipsy(element, leave, options) {
        _.bindAll(this, "clearCloseTimer");
        this.leave = leave;
        this.$element = $(element);
        this.timeoutId = 0;
        this.options = options;
        this.enabled = true;
        this.fixTitle();
    }

    Tipsy.prototype = {
        show: function() {
            var title = this.getTitle();
            if (title && this.enabled) {
                var $tip = this.tip();

                // don't pop again if already showing
                if($tip.is(":visible")){
                    return;
                }

                $tip.find('.tipsy-inner')[this.options.html ? 'html' : 'text'](title);
                $tip[0].className = 'tipsy'; // reset classname in case of dynamic gravity
                $tip.remove().css({
                    top: 0,
                    left: 0,
                    visibility: 'hidden',
                    display: 'block'
                });

                // Detect existing tooltips. If found then insert the new one after the last fount tip.
                // This ensures that the newest tooltip is lowest in the DOM so it will appear above the others.
                var existingtip = $('.tipsy').filter(':last');
                if (existingtip[0] !== undefined) {
                    $tip.insertAfter(existingtip);
                } else {
                    $tip.prependTo(document.body);
                }

                this.positionTip();
                this.positionTip(); // Run twice. If wordwrap causes tooltip to change size this will fix positioning before render.

                var that = this;
                if (this.options.fade) {
                    $tip.stop().css({
                        opacity: 0,
                        display: 'block',
                        visibility: 'visible'
                    }).animate({
                        opacity: this.options.opacity
                    }, 300, function(){
                        that.options.onOpen(that);
                    });
                } else {
                    $tip.css({
                        visibility: 'visible',
                        opacity: this.options.opacity
                    }).addClass('tip-animate');

                    this.options.onOpen(this);
                }

                if(this.options.interactive){
                    this.$tip.on("mouseenter.tip", this.clearCloseTimer);
                    this.$tip.on("mouseleave.tip", _.bind(this.leave, this.$element[0]));
                }
            }
        },

        positionTip: function() {
            var tip = this.$tip;
            var pos = $.extend({}, this.$element.offset(), {
                    width: this.$element[0].offsetWidth,
                    height: this.$element[0].offsetHeight
                }),
                tp,
                actualWidth = tip[0].offsetWidth,
                actualHeight = tip[0].offsetHeight,
                gravity = maybeCall(this.options.gravity, this.$element[0]);

            switch (gravity.charAt(0)) {
                case 'n':
                    tp = {
                        top: pos.top + pos.height + this.options.offset,
                        left: pos.left + pos.width / 2 - actualWidth / 2
                    };
                    break;
                case 's':
                    tp = {
                        top: pos.top - actualHeight - this.options.offset,
                        left: pos.left + pos.width / 2 - actualWidth / 2
                    };
                    break;
                case 'e':
                    tp = {
                        top: pos.top + pos.height / 2 - actualHeight / 2,
                        left: pos.left - actualWidth - this.options.offset
                    };
                    break;
                case 'w':
                    tp = {
                        top: pos.top + pos.height / 2 - actualHeight / 2,
                        left: pos.left + pos.width + this.options.offset
                    };
                    break;
            }


            var styleTipWidth = tip.find('.tipsy-arrow').outerWidth(),
                tipPointTargetFromLeft = Math.round(pos.left + (this.$element.outerWidth() / 2) ),
                tipPointTargetFromRight = Math.round( $(window).width() - (pos.left + (this.$element.outerWidth() / 2) ) ),
                tipsyPaddingWE = (tip.outerWidth() - tip.width()) / 2,
                minTipCenterOffset = this.options.styleTipOffsetWE + ( styleTipWidth / 2 );


            if (gravity.length == 2) {
                var adjust;

                if (gravity.charAt(1) == 'w') {
                    tp.left = pos.left + pos.width / 2 - 30;
                    if (tipPointTargetFromLeft < minTipCenterOffset) {
                        // reposition if too close to the edge. Account for padding as well.
                        adjust = ( ( tipPointTargetFromLeft - styleTipWidth / 2 ) >= tipsyPaddingWE ? ( tipPointTargetFromLeft - styleTipWidth / 2 ) : tipsyPaddingWE );
                        tip.find('.tipsy-arrow, .tipsy-arrow-border').css('left', adjust);
                    }
                } else {
                    tp.left = pos.left + pos.width / 2 - actualWidth + 30;
                    if (tipPointTargetFromRight < minTipCenterOffset) {
                        adjust = ( ( tipPointTargetFromRight - styleTipWidth / 2 ) >= tipsyPaddingWE ? ( tipPointTargetFromRight - styleTipWidth / 2 ) : tipsyPaddingWE );
                        tip.find('.tipsy-arrow, .tipsy-arrow-border').css('right', adjust);
                    }
                }
            }

            if (tp.left < 0) { tp.left = 0; } // Dont let the tooltip have negative left position

            tip.css(tp).addClass('tipsy-' + gravity);
            tip.find('.tipsy-arrow')[0].className = 'tipsy-arrow tipsy-arrow-' + gravity.charAt(0);
            tip.find('.tipsy-arrow-border')[0].className = 'tipsy-arrow-border tipsy-arrow-border-' + gravity.charAt(0);

            if (this.options.className) {
                this.$tip.addClass(maybeCall(this.options.className, this.$element[0]));
            }
        },

        hide: function() {
            if (this.options.fade) {
                this.tip().stop().fadeOut(function() {
                    $(this).remove();
                });
            } else {
                this.tip().remove();
            }
        },

        fixTitle: function() {
            var $e = this.$element;
            if ($e.attr('title') || typeof($e.attr('data-title')) != 'string') {
                $e.attr('data-title', $e.attr('title') || '').removeAttr('title');
            }
        },

        getTitle: function() {
            var title,
                $e = this.$element,
                o = this.options;

            this.fixTitle();

            if (typeof o.title == 'string') {
                if(o.title == 'data-title' || o.title == 'title'){
                    title = $e.attr(o.title == 'title' ? 'data-title' : o.title);
                } else {
                    title = o.title;
                }
            } else if (typeof o.title == 'function') {
                title = o.title.call($e[0]);
            }

            var template = o.templateMethod(title || o.fallback, $e.attr("data-template") || o.template);

            this.options.onCreate(template);
            return template;
        },

        tip: function() {
            if (!this.$tip) {
                this.$tip = $(_.result(this.options, 'tipTemplate'));

                this.$tip.data('tipsy-pointee', this.$element[0]);
            }
            return this.$tip;
        },

        validate: function() {
            if (!this.$element[0].parentNode) {
                this.remove();
            }
        },

        remove: function(){
            this.hide();
            this.$element.removeData("tipsy");
            this.$element.off(".tip");
            this.$element.showTip = undefined;
            this.$element.hideTip = undefined;
            this.$element = null;
            this.options.onClose(this);
            this.options = null;
        },

        clearCloseTimer: function(){
            if(this.timeoutId){
                clearTimeout(this.timeoutId);
                this.timeoutId = 0;
            }
        },

        enable: function() {
            this.enabled = true;
        },
        disable: function() {
            this.enabled = false;
        },
        toggleEnabled: function() {
            this.enabled = !this.enabled;
        }
    };

    $.fn.tipsy = function(options) {

        if (options === true) {
            return this.data('tipsy');
        } else if (typeof options == 'string') {
            var tipsy = this.data('tipsy');
            if (tipsy) {
                tipsy[options]();
            }
            return this;
        }

        options = $.extend({}, $.fn.tipsy.defaults, options);

        function get(ele) {
            var tipsy = $.data(ele, 'tipsy');
            if (!tipsy) {
                tipsy = new Tipsy(ele, leave, $.fn.tipsy.elementOptions(ele, options));
                $.data(ele, 'tipsy', tipsy);
            }
            return tipsy;
        }

        function enter() {
            var tipsy = get(this);

            tipsy.hoverState = 'in';
            if (options.delayIn === 0) {
                tipsy.show();
            } else {
                tipsy.fixTitle();
                setTimeout(function() {
                    if (tipsy.hoverState == 'in') {
                        tipsy.show();
                    }
                }, options.delayIn);
            }
        }

        function leave() {
            var tipsy = get(this);
            tipsy.hoverState = 'out';

            if (options.delayOut === 0) {
                tipsy.hide();
            } else {
                tipsy.clearCloseTimer();
                tipsy.timeoutId = setTimeout(function() {
                    if (tipsy.hoverState == 'out') {
                        tipsy.hide();
                    }
                }, options.delayOut);
            }
        }

        if (options.clear) {
            this.each(function() {
                get(this).remove();
            });
            return;
        }

        if (!options.live) {
            this.each(function() {
                get(this);
            });
        }

        if (options.trigger != 'manual') {
            var eventIn = options.trigger == 'hover' ? 'mouseenter' : 'focus',
                eventOut = options.trigger == 'hover' ? 'mouseleave' : 'blur';

            if (options.live) {
                $(this.context).on(eventIn + ".tip", this.selector, enter);

                if(!options.stayOpen){
                    $(this.context).on(eventOut + ".tip", this.selector, leave);
                }
            } else {
                this.on(eventIn + ".tip", enter);

                if(!options.stayOpen) {
                    this.on(eventOut + ".tip", leave);
                }
            }
        } else {
            this.showTip = function(title) {
                if (title) {
                    var tipsy = get(this);
                    tipsy.options.title = title;
                }
                enter.apply(this);
            }.bind(this);
            this.hideTip = leave.bind(this);
        }

        return this;
    };

    // Overwrite this method to provide options on a per-element basis.
    // For example, you could store the gravity in a 'tipsy-gravity' attribute:
    // return $.extend({}, options, {gravity: $(ele).attr('tipsy-gravity') || 'n' });
    // (remember - do not modify 'options' in place!)
    $.fn.tipsy.elementOptions = function(ele, options) {
        return $.metadata ? $.extend({}, options, $(ele).metadata()) : options;
    };

    $.fn.tipsy.autoNS = function() {
        return $(this).offset().top > ($(document).scrollTop() + $(window).height() / 2) ? 's' : 'n';
    };

    $.fn.tipsy.autoWE = function() {
        return $(this).offset().left > ($(document).scrollLeft() + $(window).width() / 2) ? 'e' : 'w';
    };

    $.fn.tipsy.autoSEW = function() {
        var $elm = $(this);
        var $ew = $elm.offset().left > ($(document).scrollLeft() + $(window).width() / 2) ? 'e' : 'w';
        return 's'+$ew;
    };

    var defaultTipTemplate = '<div><div class="tipsy-arrow-border"></div><div class="tipsy-arrow"></div><div class="tipsy-inner"></div></div>';

    $.fn.tipsy.defaults = {
        className: null,
        delayIn: 0,
        delayOut: 0,
        fade: false,
        fallback: '',
        gravity: $.fn.tipsy.autoSEW,
        html: true,
        live: false,
        stayOpen: false,
        offset: 6, // offset from element
        opacity: 1,
        title: 'title',
        trigger: 'hover',
        templateMethod: function(i) { return i; }, // used to output all tip views
        template: "title",
        tipTemplate: defaultTipTemplate,
        styleTipOffsetWE: 22,
        onCreate: function(){

        },
        onOpen: function(){

        },
        onClose: function(){

        },
        interactive: false, // will let you mouse over the tooltip
        clear: false,       // if true, removes an existing tooltip from this element
    };

    $.fn.tipsy.revalidate = function() {
        $('.tipsy').each(function() {
            var pointee = $.data(this, 'tipsy-pointee');
            if (!pointee || !isElementInDOM(pointee)) {
                $(this).remove();
            }
        });
    };

    /**
     * Improved version of autoBounds for automatic placement of chunky tips
     * The original autoBounds failed in two regards: 1. it would never return a 'w' or 'e', gravity even if they
     * were preferred and/or optimal, 2. it only respected the margin between the left hand side of an element and
     * left hand side of the viewport, and the top of an element and the top of the viewport. This version checks
     * to see if the bottom of an element is too close to the bottom of the screen, similarly for the right hand side
     */
    $.fn.tipsy.autoBounds = function(margin, prefer) {
        return function() {
            var dir = {},
                boundTop = $(document).scrollTop() + margin,
                boundLeft = $(document).scrollLeft() + margin,
                $this = $(this);

            // bi-directional string (ne, se, sw, etc...)
            if (prefer.length > 1) {
                dir.ns = prefer[0];
                dir.ew = prefer[1];
            } else {
                // single direction string (e, w, n or s)
                if (prefer[0] == 'e' || prefer[0] == 'w') {
                    dir.ew = prefer[0];
                } else {
                    dir.ns = prefer[0];
                }
            }

            if ($this.offset().top < boundTop) {
                dir.ns = 'n';
            }
            if ($this.offset().left < boundLeft) {
                dir.ew = 'w';
            }
            if ($(window).width() + $(document).scrollLeft() - ($this.offset().left + $this.width()) < margin) {
                dir.ew = 'e';
            }
            if ($(window).height() + $(document).scrollTop() - ($this.offset().top + $this.height()) < margin) {
                dir.ns = 's';
            }

            if (dir.ns) {
                return dir.ns + (dir.ew ? dir.ew : '');
            }
            return dir.ew;
        };
    };

    /**
     * Removes all tipsy elements from the DOM
     */
    $.fn.tipsy.clear = function() {
        $('.tipsy').remove();
    };

});
