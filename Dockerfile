FROM node:alpine

EXPOSE 1337

WORKDIR /var/www

COPY lib/ /var/www/lib/
COPY *.mjs /var/www/
COPY tests/ /var/www/tests/

RUN node --test tests/

ENV PORT=1337
CMD ["node", "index.mjs"]
