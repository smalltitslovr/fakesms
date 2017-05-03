function imgurPost(endpoint, data, cb) {
  $.ajax({
    url: `https://api.imgur.com/3/${endpoint}`,
    type: 'post',
    data,
    headers: {
      'Authorization': 'Client-ID 2fc446b6baf989e'
    },
    success: cb
  })

}

$(document).ready(function(){
  var node = document.getElementById('phone');
  
  $('#generate-images').click(function(){
      $('#imgur-album-output').html('Generating...')
      imgurPost('album', {}, function(albumResponse) {
        const deletehash = albumResponse.data.deletehash
        domtoimage.toPng(node)
          .then(function (png) {
            const image = png.replace(/^data:image\/png;base64,/, '')
            imgurPost(
              'image', 
              { image, album: deletehash, type: 'base64' }, 
              function(imageResponse) {
                const albumUrl = `http://imgur.com/a/${albumResponse.data.id}`
                
                $('#imgur-album-output').html(`Imgur album: ${albumUrl}`)
              })
          })
          .catch(function (error) {
            console.error('oops, something went wrong while generating the image!', error);
          })
      }
    )
  })

})
