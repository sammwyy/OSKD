use axum::{body::Body, routing::get, Server};
use http::Response;
use socketio_server::{
    config::SocketIoConfig, layer::SocketIoLayer, ns::Namespace, socket::Socket,
};
use std::{
    sync::{Arc, Mutex},
    time::Duration,
};

use mki::Action;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("Starting application...");

    // Create client list.
    let clients = Arc::new(Mutex::new(Vec::<Arc<Socket>>::new()));
    let clients_clone = clients.clone();

    // Create Socket.IO server.
    let config = SocketIoConfig::builder()
        .ping_interval(Duration::from_secs(5))
        .ping_timeout(Duration::from_secs(5))
        .max_payload(1e6 as u64)
        .build();

    let ns_handler = Namespace::builder()
        .add("/", move |socket| {
            let clients = clients_clone.clone();
            async move {
                clients.lock().unwrap().push(socket.clone());
            }
        })
        .build();

    // Listen keyboard.
    mki::bind_any_key(Action::handle_kb(move |key| {
        let key = key.to_string();
        let key: Vec<&str> = key.split("(").collect();
        let key_str = key.first().unwrap();

        let clients_lock = clients.lock().unwrap();
        let mut i = 0;

        for socket in clients_lock.iter() {
            socket.emit("keydown", key_str).unwrap();
            i += 1;
        }

        println!("Sent input {} to {} connected clients.", key_str, i);
    }));

    // Create HTTP service.
    let app = axum::Router::new()
        .route(
            "/",
            get(move || async {
                let html = include_str!("../public/index.html");
                Response::new(Body::from(html))
            }),
        )
        .route(
            "/socket-io.js",
            get(move || async {
                let js = include_str!("../public/socket-io.js");
                js
            }),
        )
        .layer(SocketIoLayer::from_config(config, ns_handler));

    let addr = "127.0.0.1:41770";
    println!("Listening widget on http://{}/", addr);
    Server::bind(&addr.parse().unwrap())
        .serve(app.into_make_service())
        .await?;

    println!("Shutting down application.");
    Ok(())
}
