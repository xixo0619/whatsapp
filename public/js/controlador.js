function modalRegistro(){
	$("#modalRegistro").modal("show");
}

$('#btn-login').click(function () {
	var data = `usuario=${$('#txt-usuario').val()}&password=${$('#txt-password').val()}`;
	// alert(data);
	$.ajax({
        url:"/login",
        data: data,
        method:"POST",
        dataType:"json",
        success:function(response){
			console.log(response);
            if (response.estatus == 0 ){
                // alert("Credenciales correctas");    
                window.location.href ="home.html";
			}
            else
                alert("Credenciales incorrectas");
            console.log(response);
        }
    }); 
});

$('#btn-guardar').click(function () {
    data = `correo=${$('#txt-correo').val()}&usuario=${$('#txt-nombreUsuario').val()}&contrasena=${$('#txt-contrasena').val()}&imagen=${$('#txt-imagen').val()}`;
    // alert(data);
	$.ajax({
		url: "/crear-usuario",
        data: data,
        method:"POST",
		dataType: "json",
		success: function (response) {
            console.log(response);
            alert('Usuario insertado sastifactoriamente');
		}
	});
});