$("#slc-usuario").change(function(){
	cargarConversacion();
});

function seleccionarContacto(codigoContacto, nombreContacto, urlImagen){
	$("#usuario-receptor").val(codigoContacto);
	$("#nombre-contacto").html(nombreContacto);
	$("#imagen-contacto").attr("src",urlImagen);
	cargarConversacion();
}

$(document).ready(function(){
	cargarContactos();
	cargarDatosUsuario();
	obtenerUsuarios();
});

function cargarConversacion(){
	console.log("Enviar al servidor: Emisor: " + $("#slc-usuario").val() + ", Receptor: " + $("#usuario-receptor").val());
	$.ajax({
		url:"/obtener-conversacion",
		method:"GET",
		data:"receptor="+$("#usuario-receptor").val(),
		dataType:"json",
		success:function(respuesta){
			console.log(respuesta);
			$("#conversation").html("");
			for(var i=0; i<respuesta.length;i++){
				var cssClass=""; //sender
				if ($("#usuario-emisor").val() == respuesta[i].codigo_usuario_emisor)
					cssClass="sender"; 
				else
					cssClass="receiver"; 
				$("#conversation").append(
					`<div class="row message-body">
						<div class="col-sm-12 message-main-${cssClass}">
						<div class="${cssClass}">
							<div class="message-text">
							${remplazarEmojis(respuesta[i].mensaje)}
							</div>
							<span class="message-time pull-right">
							${respuesta[i].hora_mensaje}
							</span>
						</div>
						</div>
					</div>`
				);
			}
		}
	});
}

$("#btn-enviar").click(function(){
	//alert("Enviar mensaje: " + $("#txta-mensaje").val());
	var date = new Date();
	var parametros = "emisor="+$("#slc-usuario").val() + "&" + 
					 "receptor="+$("#usuario-receptor").val() + "&"+
					 "mensaje="+$("#txta-mensaje").val();
	$.ajax({
		url:"/enviar-mensaje",
		method:"POST",
		data:parametros,
		dataType:"json",
		success:function(respuesta){
			if (respuesta.affectedRows==1){
				$("#conversation").append(
					`<div class="row message-body">
						<div class="col-sm-12 message-main-sender">
						<div class="sender">
							<div class="message-text">
							${remplazarEmojis($("#txta-mensaje").val())}
							</div>
							<span class="message-time pull-right">
							${date.getHours()}:${date.getMinutes()}
							</span>
						</div>
						</div>
					</div>`
				);
			}
			console.log(respuesta);
			$("#txta-mensaje").val('');
		}
	});
});

function modalAgregarContacto(){
	$("#modalAgregarContacto").modal("show");
	// alert('agregar contacto');
}

function cargarContactos() {
	//Esta funcion se ejecuta cuando la página esta lista
	$.ajax({
		url:"/obtener-usuarios",
		dataType:"json",
		success:function(respuesta){
			console.log(respuesta);
			$("#div-contactos").html('');
			for(var i=0; i<respuesta.length; i++){
				$("#slc-usuario").append('<option value="'+respuesta[i].codigo_usuario+'">'+respuesta[i].nombre_usuario+'</option>');
				$("#div-contactos").append(
					`<div class="row sideBar-body" onclick="seleccionarContacto(${respuesta[i].codigo_usuario},'${respuesta[i].nombre_usuario}','${respuesta[i].url_imagen_perfil}');">
						<div class="col-sm-3 col-xs-3 sideBar-avatar">
						<div class="avatar-icon">
							<img src="${respuesta[i].url_imagen_perfil}">
						</div>
						</div>
						<div class="col-sm-9 col-xs-9 sideBar-main">
						<div class="row">
							<div class="col-sm-8 col-xs-8 sideBar-name">
							<span class="name-meta">${respuesta[i].nombre_usuario}</span>
							</div>
							<div class="col-sm-4 col-xs-4 pull-right sideBar-time">
							<span class="time-meta pull-right">${respuesta[i].hora_ultimo_mensaje}
							</span>
							</div>
						</div>
						</div>
					</div>`
				);
			}
		}
	});
	setInterval(cargarConversacion, 15000);
}

function cargarDatosUsuario() {
	$.ajax({
		url:"/obtener-datos-usuario",
		dataType: "json",
		success: function (response) {
			$('#img-perfil').attr("src",response.url_imagen_perfil);
			$('#txt-nombreUsuario').html(response.nombre_usuario);
			$('#usuario-emisor').val(response.codigo_usuario);
		}
	});
}

function cerrarSesion() {
	$.ajax({
		url:"/logout",
		method: "POST",
		dataType: "json",
		success: function (response) {
			if(response.isSession)
				console.log('sesion cerrada');
			window.location.href ="index.html";
		}
	}); 
}

function eliminarMensajes() {
	var data = `emisor=${$('#usuario-emisor').val()}&receptor=${$('#usuario-receptor').val()}`;
	
	$.ajax({
		url:"/eliminar-mensajes",
		data: data,
		method: "POST",
		dataType: "json",
		success: function (response) {
			console.log(response);
			$("#conversation").html('');
			alert('chat limpio');
		}
	});
}

$('#btn-agregarContacto').click(function () {
	var data =  `codigoUsuario=${$('#usuario-emisor').val()}&codigoUsuarioContacto=${$('#slc-usuarios').val()}`;
	
	$.ajax({
		url:"/agregar-contacto",
		data: data,
		method: "POST",
		dataType: "json",
		success: function (response) {
			console.log(response);
			alert('contacto agregado!');
			cargarContactos();
			obtenerUsuarios();
		}
	})
});

function obtenerUsuarios() {
	var contenido ='';
	$.ajax({
		url:"/obtener-contactos-nuevos",
		method: "GET",
		dataType: "json",
		success: function (response) {
			response.forEach(element => {
				contenido+=`<option value="${element.codigo_usuario}">${element.nombre_usuario}</option>`;
			});
			$('#slc-usuarios').html(contenido);
		}
	});
}

function remplazarEmojis(texto) {
	texto = texto.replace(new RegExp(/xD/, "gi"), '<img style="height: 20px;" src="img/emojis/emoji2.png">');
	texto = texto.replace(/:\)/g, '<img style="height: 20px;" src="img/emojis/emoji1.png">');
	texto = texto.replace(/:P/gi, '<img style="height: 20px;" src="img/emojis/emoji3.png">');
	texto = texto.replace(/:\(/g, '<img style="height: 20px;" src="img/emojis/emoji4.png">');
	texto = texto.replace(/:\*/g, '<img style="height: 20px;" src="img/emojis/emoji5.png">');
	texto = texto.replace(/X_X/gi, '<img style="height: 20px;" src="img/emojis/emoji6.png">');
	texto = texto.replace(/\|\*\*\|/gi, '<img style="height: 20px;" src="img/emojis/emoji7.png">');

	return texto;
}