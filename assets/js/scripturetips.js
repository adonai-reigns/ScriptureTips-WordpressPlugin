
var $ = jQuery;
var Scripturetips = {
  
  currentTip : {},
  currentMousePos : {x:0,y:0},

  run : function(){
    $('body').delegate('.scripturetips-tip', 'mouseenter mouseleave', Scripturetips.triggerTip);
    $(document).mousemove(Scripturetips.mousemove);
  },
  
  triggerTip : function(e){
    
    e.stopPropagation();
    e.preventDefault();
    
    if(e.type === 'mouseenter'){
      
      var tipContent = $('#'+$(e.target).data('tooltipId'));
      
      // turn the notes into tooltips
      var notes = $('.st-note', tipContent);
      
      for(var i=0; i<notes.length; i++){
        var note = notes[i];
        $(note).prop('title', $(note).text());
        $(note).text('*');
      }
      
      var tipContentLeftPos = $(e.target).offset().left+'px';
      
      // position the tooltip within the width of the page
      if(tipContent.outerWidth() + tipContent.offset().left > $(window).width()){
        // the box has slid off the page
        
        // will it fit on the page?
        if(tipContent.outerWidth() < $(window).width()){
          // yes, let's move it to the left
          tipContent.css({
            left: $(window).width() - (tipContent.outerWidth() + $(e.target).outerHeight()) + 'px'
          })
        }else{
          // no, the tooltip content will not fit on the page, we need to reduce its width
          
          var newWidth = tipContent.outerWidth();
          
          while(newWidth + $(e.target).outerHeight() * 2 > $(window).width() && newWidth > 0){
            newWidth--;
          }
          
          tipContentLeftPos = $(window).width() - (newWidth + $(e.target).outerHeight()*1) + 'px';
          
        }
        
      }
      
      tipContent.fadeIn().css({
        top: $(e.target).offset().top + $(e.target).height() + 'px',
        left: tipContentLeftPos,
        zIndex: 1000
      });
      
      tipContent.css({
        minWidth: newWidth+'px',
        width: newWidth+'px'
      });
      
      $('.st-close-button', tipContent).click(function(e2){
        e2.stopPropagation();
        e2.preventDefault();
        $(tipContent).fadeOut();
      });
      
      Scripturetips.currentTip[$(e.target).data('tooltipId')] = e.target;
      
      // resize the container to fit the content, remove scrollbars if needed
      var innerSize = {};
      innerSize.height = ($('h2', tipContent).outerHeight()*1 + $('.st-inner-content', tipContent).outerHeight()*1 + $('.st-footer', tipContent).outerHeight()*1);
      
      if(tipContent.height() > innerSize.height){
        tipContent.css({
          height: (innerSize.height+8)+'px',
          overflowY: 'hidden'
        });
      }
      
   
      
      
      
      
    }else{
      Scripturetips.triggerTipOff($(e.target).data('tooltipId'));
    }
  },
  
  
  mousemove : function(){
    Scripturetips.currentMousePos.x = event.pageX;
    Scripturetips.currentMousePos.y = event.pageY;
  },
  
  triggerTipOff : function(id){
    
    var currentTip = $(Scripturetips.currentTip[id]);
    var currentTipContent = $('#'+currentTip.data('tooltipId'));
    
    var hoverZone = {};
    hoverZone.left = currentTip.offset().left < currentTipContent.offset().left
                        ? currentTip.offset().left 
                        : currentTipContent.offset().left
                        ;
    hoverZone.right = (currentTip.offset().left + currentTip.width()) > (currentTipContent.offset().left + currentTipContent.width()) 
                        ? (currentTip.offset().left + currentTip.width())
                        : (currentTipContent.offset().left + currentTipContent.width())
                        ;
    hoverZone.top = currentTip.offset().top < currentTipContent.offset().top 
                        ? currentTip.offset().top
                        : currentTipContent.offset().top
                        ;
    hoverZone.bottom = (currentTip.offset().top + currentTip.height()) > (currentTipContent.offset().top + currentTipContent.height()) 
                        ? currentTip.offset().top + currentTip.height()
                        : currentTipContent.offset().top + currentTipContent.height()
                        ;
   
    if(Scripturetips.currentMousePos.x >= hoverZone.left && Scripturetips.currentMousePos.x <= hoverZone.right
            && Scripturetips.currentMousePos.y >= hoverZone.top && Scripturetips.currentMousePos.y <= hoverZone.bottom){
      // it's inside the range, let's come back and check again soon - maybe they will have moved their ouse away
      setTimeout(function(){
        Scripturetips.triggerTipOff(id);
      }, 1000);
      return;
      
    }else{
      // ready to tip off now
      $(currentTipContent).fadeOut();
    }
    

   
  }

  
  
};

$(document).ready(function(){
  Scripturetips.run();
});
