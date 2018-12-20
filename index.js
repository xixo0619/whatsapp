var express  = require("express");
var session = require("express-session");
var bodyParser = require("body-parser");
var cookieParser = require('cookie-parser');
var mysql = require("mysql");
var app = express();

var credenciales = {
    user:"root",
    password:"",
    port:"3306",
    host:"localhost",
    database:"db_whatsapp"
};
 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieParser());

app.use(express.static("public")); //Middlewares
// app.use(session({secret:"EXAPRAC2#NOMEQUIEROQUEDARSRVLADIMIR$",resave:true, saveUninitialized:true}));
app.use(session({secret:"ASDFSDF$%%aasdera", resave: true, saveUninitialized:true}));

var home = express.static("home"); //Middlewares
app.use(function (request, response, next) {
    if (request.session.correo) {
        home(request, response, next);
    } else {
        return next();
    }
});

///Para agregar seguridad a una ruta especifica:
function verificarAutenticacion(request, response, next){
	if(request.session.correo)
		return next();
	else
		response.send("ERROR, ACCESO NO AUTORIZADO verificarAutenticacion()");
}

app.get("/home",verificarAutenticacion,  function(request, response){
    response.sendFile("home/home.html");
});

app.get("/variables", function(request, response){
    response.send("Session: " + request.session.codigo_usuario);
});

app.post("/login", function (request, response) {
   var conexion = mysql.createConnection(credenciales);
   var sql = "SELECT codigo_usuario, correo, nombre_usuario, url_imagen_perfil FROM tbl_usuarios WHERE nombre_usuario=? and contrasena=?;";
   conexion.query(sql, 
        [request.body.usuario, request.body.password],
        function (err, data, fields) {
            if (data.length > 0) {
                request.session.codigo_usuario = data[0].codigo_usuario;
                request.session.correo = data[0].correo;
                request.session.nombre_usuario = data[0].nombre_usuario;
                request.session.url_imagen_perfil = data[0].url_imagen_perfil;
                data[0].estatus = 0;
                response.send(data[0]);
            }else{
                response.send({estatus:1, mensaje: "Login fallido"}); 
            }
        }
    ); 
});

app.get("/obtener-datos-usuario", function(request, response){
    let datos = {
        codigo_usuario: request.session.codigo_usuario,
        correo: request.session.correo,
        nombre_usuario: request.session.nombre_usuario,
        url_imagen_perfil: request.session.url_imagen_perfil
    }
    response.send(datos);
});

app.get("/obtener-usuarios", function(request, response){
    var conexion = mysql.createConnection(credenciales);
    var sql = `select A.codigo_usuario, B.codigo_usuario, B.correo, B.nombre_usuario, B.url_imagen_perfil, IFNULL(C.hora_mensaje, "") AS hora_ultimo_mensaje 
                FROM tbl_contactos A
                inner join tbl_usuarios B
                on(A.codigo_usuario_contacto = B.codigo_usuario)
                left join 
                (
                    SELECT codigo_usuario_receptor,
                        DATE_FORMAT(MAX(hora_mensaje), '%H:%i') AS hora_mensaje
                    from tbl_mensajes 
                    where   codigo_usuario_emisor = ${request.session.codigo_usuario}
                            or codigo_usuario_receptor = ${request.session.codigo_usuario}
                    GROUP BY codigo_usuario_receptor
                ) C
                on (B.codigo_usuario = C.codigo_usuario_receptor)
                where A.codigo_usuario = ${request.session.codigo_usuario};`;
    var usuarios = [];
    conexion.query(sql)
    .on("result", function(resultado){
        usuarios.push(resultado);
    })
    .on("end",function(){
        response.send(usuarios);
    });   
});

app.get("/obtener-conversacion",function(request, response){
    var conexion = mysql.createConnection(credenciales);
    var sql =   `SELECT a.codigo_usuario_emisor,
                        a.codigo_usuario_receptor,
                        a.mensaje,
                        DATE_FORMAT(a.hora_mensaje, '%H:%i') AS hora_mensaje, 
                        b.nombre_usuario AS nombre_usuario_emisor,
                        c.nombre_usuario AS nombre_usuario_receptor
                FROM tbl_mensajes a
                INNER JOIN tbl_usuarios b
                on (a.codigo_usuario_emisor = b.codigo_usuario)
                INNER JOIN tbl_usuarios c
                on (a.codigo_usuario_receptor = c.codigo_usuario)
                WHERE (codigo_usuario_emisor = ? AND codigo_usuario_receptor = ?)
                OR (codigo_usuario_emisor = ?  AND codigo_usuario_receptor = ?)
                ORDER BY hora_mensaje ASC`;
    var conversacion = [];
    conexion.query(sql, 
                    [
                        request.session.codigo_usuario,
                        request.query.receptor,
                        request.query.receptor,
                        request.session.codigo_usuario
                    ])
    .on("result", function(resultado){
        conversacion.push(resultado);
    })
    .on("end",function(){
        response.send(conversacion);
    });   
});

app.post("/crear-usuario", function (request, response) {
    var conexion = mysql.createConnection(credenciales);
    var sql = 'INSERT INTO tbl_usuarios(nombre_usuario, correo, contrasena, url_imagen_perfil) VALUES (?,?,?,?);';
    
    conexion.query(
        sql,
        [request.body.usuario, request.body.correo, request.body.contrasena, request.body.imagen],
        function(err, result){
            if (err) throw err;
            response.send(result);
        }
    );
});

app.post("/enviar-mensaje", function(request, response){
    var conexion = mysql.createConnection(credenciales);
    var sql = 'INSERT INTO tbl_mensajes(codigo_usuario_emisor, codigo_usuario_receptor, mensaje, hora_mensaje) VALUES (?,?,?,now())';
    
    conexion.query(
        sql,
        [request.session.codigo_usuario, request.body.receptor, request.body.mensaje],
        function(err, result){
            if (err) throw err;
            response.send(result);
        }
    ); 
});

app.post("/eliminar-mensajes", function(request, response){
    var conexion = mysql.createConnection(credenciales);
    var sql = `DELETE FROM tbl_mensajes 
                WHERE (codigo_usuario_emisor = ? AND codigo_usuario_receptor = ?)
                OR (codigo_usuario_emisor = ?  AND codigo_usuario_receptor = ?);`;
    
    conexion.query(
        sql,
        [request.body.emisor, request.body.receptor, request.body.receptor,request.body.emisor],
        function(err, result){
            if (err) throw err;
            response.send(result);
        }
    ); 
});

app.post("/agregar-contacto", function (request, response) {
    var conexion = mysql.createConnection(credenciales);
    var sql = `INSERT INTO tbl_contactos(codigo_usuario, codigo_usuario_contacto) 
                 values (?, ?)`;
    
    conexion.query(
        sql,
        [request.body.codigoUsuario, request.body.codigoUsuarioContacto],
        function(err, result){
            if (err) throw err;
            response.send(result);
        }
    ); 
});

app.get("/obtener-contactos-nuevos", function (request, response) {
    var usuarios = [];
    var conexion = mysql.createConnection(credenciales);
    var sql = ` SELECT 	codigo_usuario, nombre_usuario 
                FROM tbl_usuarios 
                WHERE codigo_usuario NOT IN 
                ( 
                    SELECT codigo_usuario_contacto FROM tbl_contactos WHERE codigo_usuario = ${request.session.codigo_usuario}
                ) AND codigo_usuario != ${request.session.codigo_usuario};`;

    conexion.query(sql)
    .on("result", function(resultado){
        usuarios.push(resultado);
    })
    .on("end",function(){
        response.send(usuarios);
    });  
});

app.post("/logout", function (request, response) {
    request.session.destroy();
    response.send({isSession: false});    
});


app.listen(3000);