$(document).ready(function(){
  var $p = $('p');
  var $img = $('img');

  console.log($img);

  $('#theform').on('submit', function(e){
    e.preventDefault();
    $img.show();
    $p.html('loading..');
    var threadId = $('input').val();
    var forumId = $('option:selected').attr('value');
    $('.thread-id').val('');
    $.get('/forum/' + forumId + "/thread/" + threadId, function(data){
      $p.html(data);
    })
    .fail(function(){
      $p.html("Something went wrong...");
    })
    .always(function(){
      $img.hide();
    });
  });
});