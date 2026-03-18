#!/bin/bash
cd /var/www/rbmap || exit 1
SECRET=$(openssl rand -base64 32)
cp .env.production .env.production.bak
python3 -c "
import re, sys
secret = sys.argv[1]
with open('.env.production', 'r') as f:
    c = f.read()
c = re.sub(r'^NEXTAUTH_SECRET=.*', 'NEXTAUTH_SECRET=' + secret, c, flags=re.M)
with open('.env.production', 'w') as f:
    f.write(c)
print('Updated')
" "$SECRET"
