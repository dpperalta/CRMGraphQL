const Usuario = require('../models/Usuario');
const Producto = require('../models/Producto');
const Cliente = require('../models/Cliente');
const Pedido = require('../models/Pedido');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'variables.env' });

// DATA
/*const cursos = [{
        titulo: 'JavaScript Moderno Guía Definitiva Construye +10 Proyectos',
        tecnologia: 'JavaScript ES6',
    },
    {
        titulo: 'React – La Guía Completa: Hooks Context Redux MERN +15 Apps',
        tecnologia: 'React',
    },
    {
        titulo: 'Node.js – Bootcamp Desarrollo Web inc. MVC y REST API’s',
        tecnologia: 'Node.js'
    },
    {
        titulo: 'ReactJS Avanzado – FullStack React GraphQL y Apollo',
        tecnologia: 'React'
    }
];*/

const crearToken = (usuario, secreta, expiresIn) => {
    const { id, email, nombre, apellido } = usuario;

    return jwt.sign({ id, email, nombre, apellido }, secreta, { expiresIn })
}

// Resolvers
const resolvers = {
    /*Query: {
        obtenerCursos: (_, { input }, ctx) => {
            const resultado = cursos.filter(curso => curso.tecnologia === input.tecnologia);
            console.log(ctx);
            return resultado;
        },
        obtenerTecnologias: () => cursos
    }*/
    Query: {
        obtenerUsuario: async(_, {}, ctx) => {
            /*const usuarioID = await jwt.verify(token, process.env.SECRETA);

            return usuarioID;*/
            return ctx.usuario;
        },
        obtenerProductos: async() => {
            try {
                const productos = await Producto.find({});
                return productos;
            } catch (error) {
                console.log('Hubo un error', error);
            }
        },
        obtenerProducto: async(_, { id }) => {
            // Revisra si el producto existe
            const producto = await Producto.findById(id);
            if (!producto) {
                throw new Error('Producto no encontrado');
            }

            return producto;
        },
        obtenerClientes: async() => {
            try {
                const clientes = await Cliente.find({});
                return clientes;
            } catch (error) {
                console.log('Hubo un error:', error);
            }
        },
        obtenerClientesVendedor: async(_, {}, ctx) => {
            try {
                const clientes = await Cliente.find({ vendedor: ctx.usuario.id.toString() });
                return clientes;
            } catch (error) {
                console.log('Hubo un error:', error);
            }
        },
        obtenerCliente: async(_, { id }, ctx) => {
            // Revisar si el cliente existe
            const cliente = await Cliente.findById(id);
            if (!cliente) {
                throw new Error('Cliente no encontrado');
            }
            // Revisar quién fue el creador del cliente para visualizar
            if (cliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('Permisos insuficientes para visualizar el cliente');
            }
            return cliente;
        },
        obtenerPedidos: async() => {
            try {
                const pedidos = await Pedido.find();
                return pedidos;
            } catch (error) {
                console.log('Hubo un error:', error);
            }
        },
        obtenerPedidosVendedor: async(_, {}, ctx) => {
            try {
                const pedidos = await Pedido.find({ vendedor: ctx.usuario.id }).populate('cliente');
                return pedidos;
            } catch (error) {
                console.log('Hubo un error:', error);
            }
        },
        obtenerPedido: async(_, { id }, ctx) => {
            // Verificar si el pedido existe
            const pedido = await Pedido.findById(id);
            if (!pedido) {
                throw new Error('El pedido no fue encontrado');
            }

            // Verificar el creador del pedido
            if (pedido.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No existen permisos suficientes para realizar la acción');
            }

            // Devolver resultado
            return pedido;
        },
        obtenerPedidosEstado: async(_, { estado }, ctx) => {
            const pedidos = await Pedido.find({ vendedor: ctx.usuario.id, estado });
            return pedidos;
        },
        mejoresClientes: async() => {
            const clientes = await Pedido.aggregate([
                { $match: { estado: 'COMPLETADO' } },
                {
                    $group: {
                        _id: '$cliente',
                        total: { $sum: '$total' }
                    }
                },
                {
                    $lookup: {
                        from: 'clientes',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'cliente'
                    }
                },
                {
                    $limit: 10
                },
                {
                    $sort: { total: -1 }
                }
            ]);
            return clientes;
        },
        mejoresVendedores: async() => {
            const vendedores = await Pedido.aggregate([
                { $match: { estado: 'COMPLETADO' } },
                {
                    $group: {
                        _id: '$vendedor',
                        total: { $sum: '$total' }
                    }
                },
                {
                    $lookup: {
                        from: 'usuarios',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'vendedor'
                    }
                },
                {
                    $limit: 3
                },
                {
                    $sort: { total: -1 }
                }
            ]);
            return vendedores;
        },
        buscarProducto: async(_, { texto }) => {
            const productos = await Producto.find({ $text: { $search: texto } }).limit(20);
            return productos;
        }
    },
    Mutation: {
        nuevoUsuario: async(_, { input }) => {
            const { email, password } = input;
            // Revisar si el usuario ya está registrado
            const existeUsuario = await Usuario.findOne({ email });
            if (existeUsuario) {
                throw new Error('El usuario ya está registrado');
            }
            // Generar contraseña hasheada
            const salt = await bcryptjs.genSalt(10);
            input.password = await bcryptjs.hash(password, salt);

            // Guardar usuario en base de datos
            try {
                const usuario = new Usuario(input);
                usuario.save();
                return usuario;
            } catch (error) {
                console.log('Error al crear usuario:', error);
            }
        },
        autenticarUsuario: async(_, { input }) => {
            const { email, password } = input;
            // Validar si el usuario existe
            const existeUsuario = await Usuario.findOne({ email });
            if (!existeUsuario) {
                throw new Error('El usuario ingresado no existe');
            }

            // Revisar si el password es correcto
            const passwordCorrecto = await bcryptjs.compare(password, existeUsuario.password);
            if (!passwordCorrecto) {
                throw new Error('Usuario o Password incorrectos');
            }

            // Crear token
            return {
                token: crearToken(existeUsuario, process.env.SECRETA, '16h')
            }
        },

        nuevoProducto: async(_, { input }) => {
            try {
                const nuevoProducto = new Producto(input);
                // Guardar producto en Base de Datos
                const producto = await nuevoProducto.save();
                return producto;
            } catch (error) {
                console.log('Hubo un error:', error);
            }
        },
        actualizarProducto: async(_, { id, input }) => {
            let producto = await Producto.findById(id);
            if (!producto) {
                throw new Error('Product no encontrado');
            }

            // Guardar en base de datos el producto actualizado
            producto = await Producto.findOneAndUpdate({ _id: id }, input, { new: true });
            return producto;
        },
        eliminarProducto: async(_, { id }) => {
            // Revisar si el producto existe en la base de datos
            let producto = await Producto.findById(id);
            if (!producto) {
                throw new Error('Producto no encontrado');
            }
            // Eliminar de la base de datos el producto
            await Producto.findOneAndDelete({ _id: id });
            return 'Producto eliminado satisfactoriamente';
        },
        nuevoCliente: async(_, { input }, ctx) => {
            console.log(ctx);
            const { email } = input;
            // Verificar si el cliente ya está registrado
            const cliente = await Cliente.findOne({ email });
            if (cliente) {
                throw new Error('El cliente ya se encuentra registrado');
            }
            // Asignar el vendedor
            const nuevoCliente = new Cliente(input);
            nuevoCliente.vendedor = ctx.usuario.id;
            // Guardar en la base de datos
            try {
                const resultado = await nuevoCliente.save();
                return resultado;
            } catch (error) {
                console.log('Hubo un error:', error);
            }

        },
        actualizarCliente: async(_, { id, input }, ctx) => {
            // Verificar si el cliente existe
            let cliente = await Cliente.findById(id);
            if (!cliente) {
                throw new Error('El cliente no existe');
            }
            // Verificar si el vendedor es quién edita al cliente
            if (cliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('Permisos insuficientes para realizar la actualización');
            }
            // Guardar el cliente actualizado
            cliente = await Cliente.findOneAndUpdate({ _id: id }, input, { new: true });
            return cliente;
        },
        eliminarCliente: async(_, { id }, ctx) => {
            // Verificar si el cliente existe
            let cliente = await Cliente.findById(id);
            if (!cliente) {
                throw new Error('El cliente no existe');
            }
            // Verificar si el vendedor es quién edita al cliente
            if (cliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('Permisos insuficientes para realizar la actualización');
            }
            // Eliminar Cliente
            await Cliente.findOneAndDelete({ _id: id });
            return 'Cliente eliminado satisfactoriamente';
        },
        nuevoPedido: async(_, { input }, ctx) => {
            const { cliente } = input;
            // Verificar si el cliente existe
            let existeCliente = await Cliente.findById(cliente);
            if (!existeCliente) {
                throw new Error('El cliente solicitado no existe');
            }
            // Verificar si el cliente es cliente del vendedor
            if (existeCliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('Permisos insuficientes para realizar la operación');
            }
            // Validar stock disponible
            for await (const articulo of input.pedido) { // for await es un operador asíncrono
                const { id } = articulo;
                const producto = await Producto.findById(id);
                if (articulo.cantidad > producto.existencia) {
                    throw new Error(`El producto: ${ producto.nombre } supera la candida de stock disponible`);
                } else {
                    // Disminuir stock con los datos del pedido
                    producto.existencia = producto.existencia - articulo.cantidad;
                    await producto.save();
                }
            }
            // Crear nuevo pedido
            const nuevoPedido = new Pedido(input);

            // Asignar vendedor
            nuevoPedido.vendedor = ctx.usuario.id;

            // Guardar en base de datos
            const resultado = await nuevoPedido.save();
            return resultado;
        },
        actualizarPedido: async(_, { id, input }, ctx) => {
            const { cliente } = input;
            // Verificar si el pedido existe
            const pedidoExiste = await Pedido.findById(id);
            if (!pedidoExiste) {
                throw new Error('El pedido solicitado no existe');
            }
            // Verificar si el cliente existe
            const clienteExiste = await Cliente.findById(cliente);
            if (!clienteExiste) {
                throw new Error('El cliente solicitado no existe');
            }
            // Verificar si el cliente y pedido pertenecen al vendedor
            if (clienteExiste.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('Permisos insuficientes para realizar la operación');
            }
            // Revisar stock
            if (input.pedido) {
                for await (const articulo of input.pedido) {
                    const { id } = articulo;
                    const producto = await Producto.findById(id);
                    if (articulo.cantidad > producto.existencia) {
                        throw new Error(`El producto: ${ producto.nombre } supera la candida de stock disponible`);
                    } else {
                        producto.existencia = producto.existencia - articulo.cantidad;
                        await producto.save();
                    }
                }
            }
            // Guardar pedido
            const resultado = await Pedido.findByIdAndUpdate({ _id: id }, input, { new: true });
            return resultado;
        },
        eliminarPedido: async(_, { id }, ctx) => {
            // Verificar si el pedido existe
            const pedido = await Pedido.findById(id);
            if (!pedido) {
                throw new Error('El pedido solicitado no existe');
            }
            // Verificar si el vendedor lo intenta borrar
            if (pedido.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('Permisos insuficientes para realizar la operación');
            }
            // Eliminar de la base de datos
            await Pedido.findOneAndDelete({ _id: id });
            return 'Pedido eliminado satisfactoriamente';
        }
    }
}

module.exports = resolvers;