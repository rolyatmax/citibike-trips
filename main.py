# main.py
import csv

import numpy
from Pycluster import *

data_dir = 'data/'
paths = ['2013-07.csv', '2013-08.csv', '2013-09.csv', '2013-10.csv',
         '2013-11.csv', '2013-12.csv', '2014-01.csv', '2014-02.csv']

counts = []
headers = []
genders = {}
usertypes = {}
birthyears = {}
rides = {}
routes = {}
stations = {}

def crunch_numbers():
    most_traveled = 0
    most_traveled_alert = 'I got nothin'

    for i in range(len(paths)):
        ifile = open(data_dir + paths[i], 'rb')
        reader = csv.reader(ifile)
        counts.append(0)
        for row in reader:
            if counts[i] == 0:
                headers.append(row)
            else:
                gender = row[14]
                usertype = row[12]
                birthyear = row[13]
                bikeid = row[11]
                start_station = row[3]
                start_station_name = row[4]
                start_station_lat = row[5]
                start_station_long = row[6]
                end_station = row[7]
                end_station_name = row[8]
                end_station_lat = row[9]
                end_station_long = row[10]

                genders.setdefault(gender, 0)
                usertypes.setdefault(usertype, 0)
                birthyears.setdefault(birthyear, 0)
                rides.setdefault(bikeid, 0)
                routes.setdefault(start_station, {})
                routes[start_station].setdefault(end_station, 0)

                station_info = {
                    'id': start_station,
                    'name': start_station_name,
                    'lat': start_station_lat,
                    'long': start_station_long
                }

                stations.setdefault(start_station, station_info)

                if start_station != end_station:
                    station_info = {
                        'id': end_station,
                        'name': end_station_name,
                        'lat': end_station_lat,
                        'long': end_station_long
                    }
                    stations.setdefault(end_station, station_info)

                genders[gender] += 1
                usertypes[usertype] += 1
                birthyears[birthyear] += 1
                rides[bikeid] += 1
                routes[start_station][end_station] += 1

                trips = routes[start_station][end_station]
                if trips > most_traveled:
                    most_traveled = trips
                    most_traveled_alert = '%s -> %s : %d trips' % (start_station_name, end_station_name, trips)

            counts[i] += 1

        print('%d percent done' % (float(i + 1) / len(paths) * 100))

    # just check and make sure all the headers are the same
    for j in range(len(headers)):
        if j == 0: continue
        if headers[j] != headers[j - 1]:
            print("%s does not equal %s" % (j, j - 1))

    years = birthyears.keys()
    years.sort()

    print('Creating station file data')
    f = open(data_dir + 'station_data.csv', 'wb')
    writer = csv.writer(f, delimiter='\t')
    [writer.writerow(s.values()) for s in stations.values()]

    print('\n')
    print('Header: %r' % headers[0])
    print('\n')
    print('Count: %r' % sum(counts))
    print('Genders: %r' % genders)
    print('User Types: %r' % usertypes)
    print('Average number of rides per bike: %d' % (sum(rides.values()) / len(rides)))
    print('Station Count: %d' % len(stations))
    print(most_traveled_alert)
    print('\n')

crunch_numbers()