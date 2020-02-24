/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


var $ = jQuery;
var Scripturetips = {
  
  currentTip : {},
  currentMousePos : {x:0,y:0},

  run : function(){
    $('p').delegate('.scripturetips-tip', 'mouseenter mouseleave', Scripturetips.triggerTip);
    $(document).mousemove(Scripturetips.mousemove);
  },
  
  triggerTip : function(e){
    
    e.stopPropagation();
    e.preventDefault();
    
    if(e.type === 'mouseenter'){
      
      var tipContent = $('#'+$(e.target).data('tooltipId'));
      
      tipContent.fadeIn().css({
        width: '300px',
        height: '180px',
        top: $(e.target).offset().top + $(e.target).height() + 'px',
        left: $(e.target).offset().left,
        zIndex: 1000
      });
      
      Scripturetips.currentTip[$(e.target).data('tooltipId')] = e.target;
      
      // resize the container to fit the content, remove scrollbars if needed
      var innerSize = {};
      innerSize.height = ($('h2', tipContent).outerHeight()*1 + $('.content', tipContent).outerHeight()*1 + $('.tip-footer', tipContent).outerHeight()*1);
      
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
