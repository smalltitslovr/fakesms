function parseMessages(input, senderName) {
  const LINE_REGEX = /^(?:\[(.*)\]\s*)?(.+?):\s*(\{)?([^\{\}]*)(\})?$/
  
  const lines = input.split('\n')
  return lines.map(function(line) {
    const match = line.match(LINE_REGEX)
    if (match) {
      const isImage = match[3] !== undefined && match[5] !== undefined
      const name = match[2]
      const isSender = senderName == name
      return {
        timestamp: match[1],
        name,
        body: match[4],
        isImage,
        isSender
      }
    }
  }).filter(function(n){ return n !== undefined })
}

$(document).ready(function(){
  $('#message-content').keyup(function(){
    const rawMessages = $("#message-content").val()
    const messages = parseMessages(rawMessages, "John")
    
    if (messages.length > 0) {
      $('#messages').html(messages.map(function(message) {
        var messageHtml = '';
        const messageClass = message.isSender ? "message-sent" : "message-received"
        const imgClass = message.isImage ? "message-pic" : ""
        
        // Start
        messageHtml += `<div class="message ${messageClass} ${imgClass}">`
        
        // Sender Name
        if (message.isSender) {
          messageHtml += `<div class="message-name">${message.name}</div>`
        }
        
        // Body start
        messageHtml += '<div class="message-text">'
        
        if (message.isImage) {
          messageHtml += `<img src="${message.body}" />`
        } else {
          messageHtml += message.body
        }
        messageHtml += '</div>'
        // Body end
        
        // End
        messageHtml += '</div>'
        return messageHtml
      }))
    }
  })
})
