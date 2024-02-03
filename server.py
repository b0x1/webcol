#!/usr/bin/env python3

from http.server import HTTPServer, SimpleHTTPRequestHandler, test

port = 8000
address = 'localhost'
custom_headers = {'Access-Control-Allow-Origin': '*'}

class CustomHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        print(custom_headers)
        for header, value in custom_headers.items():
            self.send_header(header, value)
        super().end_headers()


if __name__ == '__main__':
    test(
        CustomHandler, 
        HTTPServer,
        bind=address, 
        port=port
    )
