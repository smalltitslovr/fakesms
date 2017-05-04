function imgurPost(endpoint, data, cb = null) {
//   cb = cb || function() {}
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

function createImgurAlbum(cb) {
  console.log('Creating imgur album...')
  imgurPost('album',  {}, cb)
//   cb()
}

function createImgurImage(image, album) {
  console.log('Creating imgur image...')
  imgurPost('image',  { image, album: album.data.deletehash, type: 'base64' })
}

///////////////////////////////////////////////////////////////////////////////


function scrollDownAPage() {
  console.log('Scrolling down a page...')
  viewportElement.scrollTop(viewportElement.scrollTop() + window.scrollProperties.pageHeight)
  window.scrollProperties.currentPage += 1
  updateGeneratorStatus()
  console.log('Scrolled.')
}

function scrollToTop() {
  viewportElement.scrollTop(0)
  window.scrollProperties = {
    pageHeight: viewportElement.innerHeight(),
    currentPage: 1,
    numPages: Math.ceil($('#messages-body').height() / viewportElement.innerHeight()) 
  }
}

//////////////////////////////////////////////////////////////////////////////

function updateGeneratorStatus() {
  $('#imgur-album-output').html(`Generating...[${window.scrollProperties.currentPage}/${window.scrollProperties.numPages}]`)
}


/////////////////////////////////////////////////////////////////////////////

function generatePng(cb) {
  console.log('Generating image...')
  domtoimage.toPng(elementToScreenshot)
    .then(function(png) {
      console.log('PNG Generated.')
      cb(png.replace(/^data:image\/png;base64,/, ''))
    })
    .catch(function (error) {
      console.error('oops, something went wrong while generating the image!', error);
    })
}

// Recursive
function generateRemainingPngs(eachCb, allCb) {
  if (window.scrollProperties.currentPage >= window.scrollProperties.numPages) {
    // We're at the bottom, so exit out of the recursion
    allCb()
  } else { // We're not at the bottom.
    // Generate a png from what's currently visible
    generatePng(function(image) {
      // When it's done, call the callback with that image
      eachCb(image)
      // Then scroll down a page
      scrollDownAPage()
      // And generate any remaining images
      generateRemainingPngs(eachCb, allCb)
    })
  }
}

function createImgurAlbum() {
  scrollToTop()
  updateGeneratorStatus()
  
  imgurPost('album', {}, function(album) {
    console.log('Album created')
    
    generateRemainingPngs(function(image) {
      createImgurImage(image, album)
    }, function() {
      // All done
      console.log('Album done.')
      const albumUrl = `http://imgur.com/a/${album.data.id}`
      $('#imgur-album-output').html(`Imgur album: ${albumUrl}`)
    })

  })
}

$(document).ready(function(){
  elementToScreenshot = document.getElementById('phone');
  viewportElement = $("#messages-viewport")
//   $('#generate-images').click(function(){
//     createImgurAlbum()
//   })
})
