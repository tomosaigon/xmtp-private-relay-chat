import { db } from "./db";

interface RegistryRow {
    address: string;
    name: string;
}
interface CountRow { count: number }

function isValidName(name: string): boolean {
    return /^[a-z][a-z0-9_]*$/.test(name);
}

function isValidAddress(address: string): boolean {
    return /^0x[0-9A-Fa-f]{40}$/.test(address);
}

export async function register(name: string, address: string): Promise<boolean> {
    if (isValidName(name) && isValidAddress(address)) {
        if (!await isNameAlreadyRegistered(name)) {
            db.run('INSERT INTO registry (name, address) VALUES (?, ?)', [name, address]);
        } else {
            console.log('Name already registered:', name);
            return false;
        }
    } else {
        console.log('Invalid registration format. Usage: register <name> <address>');
        return false;
    }
    return true;
}

export async function getAllRegistrations(): Promise<{ name: string; address: string }[]> {
    const query = 'SELECT name, address FROM registry';

    return new Promise<{ name: string; address: string }[]>((resolve) => {
        db.all(query, (err, rows: RegistryRow[]) => {
            if (err) {
                console.error(err.message);
                resolve([]);
            } else {
                // Extract names and addresses from the rows
                const registrations = rows.map((row) => ({
                    name: row.name,
                    address: row.address,
                }));
                resolve(registrations);
            }
        });
    });
}

export async function isNameAlreadyRegistered(name: string): Promise<boolean> {
    const query = 'SELECT COUNT(*) AS count FROM registry WHERE name = ?';
    const params = [name];

    return new Promise<boolean>((resolve) => {
        db.get(query, params, (err, row: CountRow) => {
            if (err) {
                console.error(err.message);
                resolve(false);
            } else {
                resolve(row.count > 0);
            }
        });
    });
}

// Query the database to get all addresses except the sender's address
export async function getAddressesExceptSender(senderAddress: string): Promise<string[]> {
    const query = 'SELECT address FROM registry WHERE address <> ?';
    const params = [senderAddress];

    return new Promise<string[]>((resolve) => {
        db.all(query, params, (err, rows: RegistryRow[]) => {
            if (err) {
                console.error(err.message);
                resolve([]);
            } else {
                const addresses = rows.map((row) => row.address);
                resolve(addresses);
            }
        });
    });
}

export async function getAddresses(): Promise<string[]> {
    const query = 'SELECT address FROM registry';

    return new Promise<string[]>((resolve) => {
        db.all(query, (err, rows: RegistryRow[]) => {
            if (err) {
                console.error(err.message);
                resolve([]);
            } else {
                const addresses = rows.map((row) => row.address);
                resolve(addresses);
            }
        });
    });
}

export async function getSenderName(senderAddress: string): Promise<string> {
    const query = 'SELECT name FROM registry WHERE address = ?';
    const params = [senderAddress];

    return new Promise<string>((resolve) => {
        db.get(query, params, (err, row: RegistryRow) => {
            if (err) {
                console.error(err.message);
                resolve('');
            } else {
                const senderName = row ? row.name : '';
                resolve(senderName);
            }
        });
    });
}

export async function isAuthorizedSender(senderAddress: string): Promise<boolean> {
    const query = 'SELECT COUNT(*) AS count FROM registry WHERE address = ?';
    const params = [senderAddress];

    return new Promise<boolean>((resolve) => {
        db.get(query, params, (err, row: CountRow) => {
            if (err) {
                console.error(err.message);
                resolve(false);
            } else {
                resolve(row.count > 0);
            }
        });
    });
}